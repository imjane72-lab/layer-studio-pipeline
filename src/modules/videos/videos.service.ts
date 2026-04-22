import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';
import { PrismaService } from '../../prisma/prisma.service';
import type { Video, VideoStatus } from '@prisma/client';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(filters: { channel?: Channel; status?: VideoStatus }): Promise<Video[]> {
    return this.prisma.video.findMany({
      where: {
        channel: filters.channel,
        status: filters.status,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<Video | null> {
    return this.prisma.video.findUnique({ where: { id } });
  }

  async approve(id: string): Promise<Video> {
    return this.prisma.video.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async reject(id: string): Promise<Video> {
    return this.prisma.video.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  /**
   * Update Korean script after reviewer edits. Downstream: need to regenerate
   * Supertone audio (either full or just the edited sentences) and rebuild
   * subtitle segments.
   */
  async updateScriptKo(id: string, scriptKo: string): Promise<Video> {
    this.logger.log(`Update scriptKo for video ${id}`);
    return this.prisma.video.update({ where: { id }, data: { scriptKo } });
  }

  /**
   * Update English subtitle text only. No TTS regeneration needed — timing
   * stays anchored to the Korean audio.
   */
  async updateScriptEn(id: string, scriptEn: string): Promise<Video> {
    this.logger.log(`Update scriptEn for video ${id}`);
    return this.prisma.video.update({ where: { id }, data: { scriptEn } });
  }

  /**
   * Re-synthesize the Korean narration (Supertone) after Script Ko edits.
   * Phase 2: hook to TTS + video-renderer + S3 upload.
   */
  async regenerateAudio(id: string): Promise<Video> {
    this.logger.log(`Regenerate audio for video ${id}`);
    throw new NotImplementedException('regenerateAudio is not implemented yet (Phase 2).');
  }

  async remove(id: string): Promise<Video> {
    return this.prisma.video.delete({ where: { id } });
  }
}
