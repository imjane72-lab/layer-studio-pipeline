import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Channel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CaptionUploadService } from '../youtube/caption-upload.service';
import { YouTubeService } from '../youtube/youtube.service';
import { ApprovalOrchestratorService } from './approval-orchestrator.service';

interface PartialVideo {
  id: string;
  channel: Channel;
  status: string;
  titleEn: string;
  descriptionEn: string;
  tags: string[];
  videoUrl: string | null;
  subtitleUrl: string | null;
  youtubeVideoId: string | null;
  scheduledAt: Date | null;
  notionPageId: string | null;
}

const baseVideo = (overrides: Partial<PartialVideo> = {}): PartialVideo => ({
  id: 'vid_001',
  channel: Channel.AI,
  status: 'READY',
  titleEn: 'Title',
  descriptionEn: 'Description',
  tags: ['t1'],
  videoUrl: 's3://bucket/videos/vid_001.mp4',
  subtitleUrl: 's3://bucket/subs/vid_001.srt',
  youtubeVideoId: null,
  scheduledAt: new Date('2026-05-01T22:00:00Z'),
  notionPageId: 'notion_page_abc',
  ...overrides,
});

describe('ApprovalOrchestratorService', () => {
  let service: ApprovalOrchestratorService;
  let prisma: {
    video: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let s3: {
    parseUri: jest.Mock;
    downloadToFile: jest.Mock;
  };
  let youtube: { upload: jest.Mock };
  let captionUpload: { upload: jest.Mock };

  beforeEach(async () => {
    prisma = {
      video: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(async ({ data }: { data: unknown }) => data),
      },
    };
    s3 = {
      parseUri: jest.fn((uri: string) => {
        const match = uri.match(/^s3:\/\/([^/]+)\/(.+)$/);
        return match ? { bucket: match[1], key: match[2] } : null;
      }),
      downloadToFile: jest.fn(async (_key: string, path: string) => path),
    };
    youtube = { upload: jest.fn(async () => 'yt_new_id') };
    captionUpload = { upload: jest.fn(async () => 'cap_new_id') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ApprovalOrchestratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: s3 },
        { provide: YouTubeService, useValue: youtube },
        { provide: CaptionUploadService, useValue: captionUpload },
      ],
    }).compile();

    service = moduleRef.get(ApprovalOrchestratorService);
  });

  describe('publishByNotionPageId', () => {
    it('404s when no video matches the Notion page id', async () => {
      prisma.video.findFirst.mockResolvedValue(null);

      await expect(service.publishByNotionPageId('unknown_page')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('publishes a READY video and records youtubeVideoId', async () => {
      const video = baseVideo();
      prisma.video.findFirst.mockResolvedValue(video);
      prisma.video.findUnique.mockResolvedValue(video);

      const result = await service.publishByNotionPageId('notion_page_abc');

      expect(result.youtubeVideoId).toBe('yt_new_id');
      expect(youtube.upload).toHaveBeenCalledTimes(1);
      expect(captionUpload.upload).toHaveBeenCalledTimes(1);
      // Status transitions: APPROVED then SCHEDULED
      const statuses = prisma.video.update.mock.calls.map((c) => c[0].data.status);
      expect(statuses).toContain('APPROVED');
      expect(statuses).toContain('SCHEDULED');
    });

    it('is idempotent: second call on SCHEDULED video skips upload and returns existing id', async () => {
      const alreadyUploaded = baseVideo({
        status: 'SCHEDULED',
        youtubeVideoId: 'yt_existing_id',
      });
      prisma.video.findFirst.mockResolvedValue(alreadyUploaded);
      prisma.video.findUnique.mockResolvedValue(alreadyUploaded);

      const result = await service.publishByNotionPageId('notion_page_abc');

      expect(result.youtubeVideoId).toBe('yt_existing_id');
      expect(youtube.upload).not.toHaveBeenCalled();
      expect(captionUpload.upload).not.toHaveBeenCalled();
    });

    it('still publishes video when caption upload fails (burned-in subs cover viewers)', async () => {
      const video = baseVideo();
      prisma.video.findFirst.mockResolvedValue(video);
      prisma.video.findUnique.mockResolvedValue(video);
      captionUpload.upload.mockRejectedValue(new Error('caption boom'));

      const result = await service.publishByNotionPageId('notion_page_abc');

      expect(result.youtubeVideoId).toBe('yt_new_id');
      expect(youtube.upload).toHaveBeenCalledTimes(1);
    });

    it('marks FAILED + increments retryCount when YouTube upload fails', async () => {
      const video = baseVideo();
      prisma.video.findFirst.mockResolvedValue(video);
      prisma.video.findUnique.mockResolvedValue(video);
      youtube.upload.mockRejectedValue(new Error('youtube boom'));

      await expect(service.publishByNotionPageId('notion_page_abc')).rejects.toThrow(
        'youtube boom',
      );

      const failureCall = prisma.video.update.mock.calls.find((c) => c[0].data.status === 'FAILED');
      expect(failureCall).toBeDefined();
      expect(failureCall[0].data.retryCount).toEqual({ increment: 1 });
    });

    it('refuses publish when videoUrl is missing (not rendered yet)', async () => {
      const video = baseVideo({ videoUrl: null });
      prisma.video.findFirst.mockResolvedValue(video);
      prisma.video.findUnique.mockResolvedValue(video);

      await expect(service.publishByNotionPageId('notion_page_abc')).rejects.toThrow(
        /has no videoUrl/,
      );
      expect(youtube.upload).not.toHaveBeenCalled();
    });
  });

  describe('rejectByNotionPageId', () => {
    it('marks a READY video as REJECTED', async () => {
      const video = baseVideo({ status: 'READY' });
      prisma.video.findFirst.mockResolvedValue(video);

      const result = await service.rejectByNotionPageId('notion_page_abc', 'not good');

      expect(result.videoId).toBe('vid_001');
      expect(prisma.video.update).toHaveBeenCalledWith({
        where: { id: 'vid_001' },
        data: { status: 'REJECTED', errorLog: 'not good' },
      });
    });

    it('is idempotent when video is already REJECTED', async () => {
      prisma.video.findFirst.mockResolvedValue(baseVideo({ status: 'REJECTED' }));

      await service.rejectByNotionPageId('notion_page_abc');

      expect(prisma.video.update).not.toHaveBeenCalled();
    });

    it('refuses to reject a video already SCHEDULED on YouTube', async () => {
      prisma.video.findFirst.mockResolvedValue(
        baseVideo({ status: 'SCHEDULED', youtubeVideoId: 'yt_x' }),
      );

      await expect(service.rejectByNotionPageId('notion_page_abc')).rejects.toThrow(
        /already SCHEDULED on YouTube/,
      );
      expect(prisma.video.update).not.toHaveBeenCalled();
    });
  });
});
