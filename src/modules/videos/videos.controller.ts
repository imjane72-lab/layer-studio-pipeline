import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { Channel } from '../../common/enums/channel.enum';
import type { VideoStatus } from '@prisma/client';

interface UpdateScriptKoDto {
  scriptKo: string;
}

@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Get()
  async list(@Query('channel') channel?: Channel, @Query('status') status?: VideoStatus) {
    return this.videos.list({ channel, status });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const video = await this.videos.getById(id);
    if (!video) throw new NotFoundException(`Video ${id} not found`);
    return video;
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    return this.videos.approve(id);
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string) {
    return this.videos.reject(id);
  }

  @Patch(':id/script-ko')
  async updateScriptKo(@Param('id') id: string, @Body() body: UpdateScriptKoDto) {
    return this.videos.updateScriptKo(id, body.scriptKo);
  }

  @Post(':id/regenerate-audio')
  async regenerateAudio(@Param('id') id: string) {
    return this.videos.regenerateAudio(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.videos.remove(id);
  }
}
