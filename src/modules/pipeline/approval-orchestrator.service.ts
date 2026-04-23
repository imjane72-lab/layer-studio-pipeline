import { mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Channel as PrismaChannel } from '@prisma/client';
import { Channel } from '../../common/enums/channel.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CaptionUploadService } from '../youtube/caption-upload.service';
import { YouTubeService } from '../youtube/youtube.service';

/**
 * Triggered after a reviewer approves a video in Notion. Publishes the
 * approved video to YouTube with its official caption track and updates
 * the DB.
 *
 * Intentionally isolated from PipelineService: the create flow (D-1) and
 * the publish flow (D-Day) have different failure modes, different retry
 * policies, and different triggers (cron vs webhook).
 */
@Injectable()
export class ApprovalOrchestratorService {
  private readonly logger = new Logger(ApprovalOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly youtube: YouTubeService,
    private readonly captionUpload: CaptionUploadService,
  ) {}

  async publishByNotionPageId(notionPageId: string): Promise<{ youtubeVideoId: string }> {
    const video = await this.prisma.video.findFirst({ where: { notionPageId } });
    if (!video) {
      throw new NotFoundException(`No video found for Notion page ${notionPageId}`);
    }
    return this.publish(video.id);
  }

  /**
   * Mark a video as REJECTED in the DB. No YouTube side effect, no S3
   * cleanup — assets stay in S3 for audit until a TTL policy kicks in.
   * Idempotent: already-REJECTED returns success without re-updating.
   */
  async rejectByNotionPageId(
    notionPageId: string,
    reason?: string,
  ): Promise<{ videoId: string }> {
    const video = await this.prisma.video.findFirst({ where: { notionPageId } });
    if (!video) {
      throw new NotFoundException(`No video found for Notion page ${notionPageId}`);
    }
    if (video.status === 'REJECTED') {
      this.logger.log(`Video ${video.id} already REJECTED; skipping.`);
      return { videoId: video.id };
    }
    if (video.status === 'PUBLISHED' || video.status === 'SCHEDULED') {
      // Uploaded already — reject at this point would need an un-upload.
      // Reviewer must delete the YouTube video manually; we refuse the state change.
      throw new Error(
        `Cannot reject video ${video.id}: already ${video.status} on YouTube. Delete from YouTube Studio first.`,
      );
    }
    await this.prisma.video.update({
      where: { id: video.id },
      data: {
        status: 'REJECTED',
        errorLog: reason ?? 'Rejected via Notion approval webhook',
      },
    });
    this.logger.log(`Rejected ${video.id} (Notion page ${notionPageId})`);
    return { videoId: video.id };
  }

  async publish(videoId: string): Promise<{ youtubeVideoId: string }> {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      throw new NotFoundException(`Video ${videoId} not found`);
    }
    if (video.status === 'PUBLISHED' || video.status === 'SCHEDULED') {
      this.logger.warn(`Video ${videoId} already in status ${video.status}; skipping.`);
      return { youtubeVideoId: video.youtubeVideoId ?? '' };
    }
    if (!video.videoUrl) {
      throw new Error(`Video ${videoId} has no videoUrl (not rendered yet)`);
    }

    const channel = this.toChannel(video.channel);
    this.logger.log(`Publishing ${videoId} (${channel}) "${video.titleKo}"`);

    await this.prisma.video.update({
      where: { id: videoId },
      data: { status: 'APPROVED' },
    });

    const workDir = join(tmpdir(), `layer-studio-publish-${videoId}`);
    await mkdir(workDir, { recursive: true });

    try {
      const videoPath = await this.downloadS3Asset(video.videoUrl, workDir, 'video.mp4');
      const srtPath = video.subtitleUrl
        ? await this.downloadS3Asset(video.subtitleUrl, workDir, 'subs.srt')
        : null;

      const youtubeVideoId = await this.youtube.upload({
        channel,
        title: video.titleKo,
        description: video.descriptionKo ?? '',
        tags: video.tags,
        videoPath,
        scheduledAt: video.scheduledAt ?? undefined,
      });

      if (srtPath) {
        // Caption upload failure must NOT fail the publish — burned-in Korean
        // subtitles already cover viewers; this just removes the YouTube
        // auto-translation boost for foreign viewers.
        try {
          await this.captionUpload.upload({
            channel,
            youtubeVideoId,
            srtPath,
            language: 'ko',
          });
        } catch (err) {
          this.logger.warn(
            `Caption upload failed for ${youtubeVideoId}: ${(err as Error).message}`,
          );
        }
      }

      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          youtubeVideoId,
          status: video.scheduledAt ? 'SCHEDULED' : 'PUBLISHED',
          publishedAt: video.scheduledAt ? undefined : new Date(),
        },
      });

      this.logger.log(`Published ${videoId} -> YouTube ${youtubeVideoId}`);
      return { youtubeVideoId };
    } catch (err) {
      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'FAILED',
          errorLog: (err as Error).message,
          retryCount: { increment: 1 },
        },
      });
      throw err;
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => {
        // Best-effort cleanup; not fatal.
      });
    }
  }

  private async downloadS3Asset(
    s3Uri: string,
    workDir: string,
    filename: string,
  ): Promise<string> {
    const parsed = this.s3.parseUri(s3Uri);
    if (!parsed) {
      throw new Error(
        `Asset URI is not s3:// form (got "${s3Uri}"). Can't download for YouTube upload.`,
      );
    }
    return this.s3.downloadToFile(parsed.key, join(workDir, filename));
  }

  private toChannel(c: PrismaChannel): Channel {
    return c === PrismaChannel.AI ? Channel.AI : Channel.SKIN;
  }
}
