import { Module } from '@nestjs/common';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';
import { NewsModule } from '../news/news.module';
import { ClaudeModule } from '../claude/claude.module';
import { PexelsModule } from '../pexels/pexels.module';
import { ElevenLabsModule } from '../elevenlabs/elevenlabs.module';
import { VideoRendererModule } from '../video-renderer/video-renderer.module';
import { NotionModule } from '../notion/notion.module';
import { SlackModule } from '../slack/slack.module';
import { YouTubeModule } from '../youtube/youtube.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    NewsModule,
    ClaudeModule,
    PexelsModule,
    ElevenLabsModule,
    VideoRendererModule,
    NotionModule,
    SlackModule,
    YouTubeModule,
    S3Module,
  ],
  controllers: [PipelineController],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
