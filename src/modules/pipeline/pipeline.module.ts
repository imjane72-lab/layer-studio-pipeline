import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';
import { PipelineSchedulerService } from './pipeline-scheduler.service';
import { ApprovalOrchestratorService } from './approval-orchestrator.service';
import { NewsModule } from '../news/news.module';
import { ClaudeModule } from '../claude/claude.module';
import { PexelsModule } from '../pexels/pexels.module';
import { TtsModule } from '../tts/tts.module';
import { SubtitleModule } from '../subtitle/subtitle.module';
import { VideoRendererModule } from '../video-renderer/video-renderer.module';
import { NotionModule } from '../notion/notion.module';
import { SlackModule } from '../slack/slack.module';
import { YouTubeModule } from '../youtube/youtube.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    PrismaModule,
    NewsModule,
    ClaudeModule,
    PexelsModule,
    TtsModule,
    SubtitleModule,
    VideoRendererModule,
    NotionModule,
    SlackModule,
    YouTubeModule,
    S3Module,
  ],
  controllers: [PipelineController],
  providers: [PipelineService, PipelineSchedulerService, ApprovalOrchestratorService],
  exports: [PipelineService, ApprovalOrchestratorService],
})
export class PipelineModule {}
