import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
} from '@nestjs/common';
import { ApprovalOrchestratorService } from '../pipeline/approval-orchestrator.service';

/**
 * Expected Notion webhook payload shapes we tolerate:
 *   { page: { id: "..." } }                — common automation shape
 *   { page_id: "..." }                     — flat variant
 *   { data: { page: { id: "..." } } }      — nested wrapper
 *
 * Notion's native webhooks don't send "approved" as a field by default; the
 * trigger here is "page was modified to Approved=true" — the automation on
 * Notion's side filters, and we treat any incoming call as a publish request
 * for the referenced page. We idempotency-check inside the orchestrator
 * (videos already SCHEDULED/PUBLISHED are skipped), so a retry-happy
 * automation cannot double-upload.
 */
interface NotionWebhookPayload {
  page?: { id?: string };
  page_id?: string;
  data?: { page?: { id?: string } };
  reason?: string;
}

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly approval: ApprovalOrchestratorService) {}

  @Post('notion/approval')
  async notionApproval(
    @Body() payload: NotionWebhookPayload,
  ): Promise<{ ok: true; youtubeVideoId: string }> {
    const pageId =
      payload?.page?.id ?? payload?.page_id ?? payload?.data?.page?.id;

    if (!pageId) {
      this.logger.warn('Notion approval webhook missing page id');
      throw new BadRequestException('Missing Notion page id in payload');
    }

    this.logger.log(`Notion approval: page=${pageId}`);
    const result = await this.approval.publishByNotionPageId(pageId);
    return { ok: true, youtubeVideoId: result.youtubeVideoId };
  }

  @Post('notion/reject')
  async notionReject(
    @Body() payload: NotionWebhookPayload,
  ): Promise<{ ok: true; videoId: string }> {
    const pageId =
      payload?.page?.id ?? payload?.page_id ?? payload?.data?.page?.id;

    if (!pageId) {
      this.logger.warn('Notion reject webhook missing page id');
      throw new BadRequestException('Missing Notion page id in payload');
    }

    this.logger.log(`Notion reject: page=${pageId}`);
    const result = await this.approval.rejectByNotionPageId(pageId, payload.reason);
    return { ok: true, videoId: result.videoId };
  }

  @Post('youtube/analytics')
  async youtubeAnalytics(@Body() payload: unknown): Promise<{ ok: true }> {
    this.logger.log('YouTube analytics webhook received');
    this.logger.debug(JSON.stringify(payload));
    return { ok: true };
  }
}
