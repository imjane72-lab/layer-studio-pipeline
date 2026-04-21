import { Injectable, Logger } from '@nestjs/common';
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

  async remove(id: string): Promise<Video> {
    return this.prisma.video.delete({ where: { id } });
  }
}
