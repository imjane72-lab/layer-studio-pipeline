import { Body, Controller, Logger, Post } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  @Post('notion/approval')
  async notionApproval(@Body() payload: unknown): Promise<{ ok: true }> {
    this.logger.log(`Notion approval webhook received`);
    this.logger.debug(JSON.stringify(payload));
    return { ok: true };
  }

  @Post('youtube/analytics')
  async youtubeAnalytics(@Body() payload: unknown): Promise<{ ok: true }> {
    this.logger.log(`YouTube analytics webhook received`);
    this.logger.debug(JSON.stringify(payload));
    return { ok: true };
  }
}
