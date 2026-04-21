import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { VideosModule } from '../videos/videos.module';

@Module({
  imports: [VideosModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
