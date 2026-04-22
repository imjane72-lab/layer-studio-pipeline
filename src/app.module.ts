import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { NewsModule } from './modules/news/news.module';
import { ClaudeModule } from './modules/claude/claude.module';
import { PexelsModule } from './modules/pexels/pexels.module';
import { TtsModule } from './modules/tts/tts.module';
import { SubtitleModule } from './modules/subtitle/subtitle.module';
import { VideoRendererModule } from './modules/video-renderer/video-renderer.module';
import { NotionModule } from './modules/notion/notion.module';
import { SlackModule } from './modules/slack/slack.module';
import { YouTubeModule } from './modules/youtube/youtube.module';
import { VideosModule } from './modules/videos/videos.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { S3Module } from './modules/s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    PipelineModule,
    NewsModule,
    ClaudeModule,
    PexelsModule,
    TtsModule,
    SubtitleModule,
    VideoRendererModule,
    NotionModule,
    SlackModule,
    YouTubeModule,
    VideosModule,
    WebhooksModule,
    S3Module,
  ],
})
export class AppModule {}
