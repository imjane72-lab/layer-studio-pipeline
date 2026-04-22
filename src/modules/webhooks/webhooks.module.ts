import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { VideosModule } from '../videos/videos.module';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [VideosModule, PipelineModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
