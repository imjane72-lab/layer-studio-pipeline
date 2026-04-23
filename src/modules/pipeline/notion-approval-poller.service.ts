import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { Channel } from '../../common/enums/channel.enum';
import { NotionService } from '../notion/notion.service';
import { ApprovalOrchestratorService } from './approval-orchestrator.service';

const POLL_INTERVAL_MS = 30_000;

/**
 * Polls Notion approval DBs for pages where reviewer checked Approved=true
 * and Status is still Pending. Used instead of Notion "Send webhook"
 * automations, which require a paid Notion plan and a public callback URL.
 *
 * Idempotency: orchestrator skips already-SCHEDULED/PUBLISHED videos, and
 * we update Notion Status after each publish so the filter excludes them
 * on subsequent polls.
 */
@Injectable()
export class NotionApprovalPollerService {
  private readonly logger = new Logger(NotionApprovalPollerService.name);
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly notion: NotionService,
    private readonly approval: ApprovalOrchestratorService,
  ) {}

  @Interval('notion-approval-poll', POLL_INTERVAL_MS)
  async poll(): Promise<void> {
    const enabled =
      this.config.get<string>('NOTION_APPROVAL_POLLING_ENABLED', 'true') === 'true';
    if (!enabled) return;

    if (this.running) {
      this.logger.debug('Previous poll still running; skipping tick.');
      return;
    }
    this.running = true;

    try {
      await Promise.all([this.pollChannel(Channel.AI), this.pollChannel(Channel.SKIN)]);
    } finally {
      this.running = false;
    }
  }

  private async pollChannel(channel: Channel): Promise<void> {
    let pageIds: string[];
    try {
      pageIds = await this.notion.findApprovedPendingPages(channel);
    } catch (err) {
      this.logger.warn(
        `Notion query failed for ${channel}: ${(err as Error).message}`,
      );
      return;
    }

    if (pageIds.length === 0) return;

    this.logger.log(`[${channel}] ${pageIds.length} approved page(s) to publish`);

    for (const pageId of pageIds) {
      try {
        const { youtubeVideoId } = await this.approval.publishByNotionPageId(pageId);
        await this.notion.updatePageStatus(pageId, 'Published');
        this.logger.log(
          `[${channel}] Notion ${pageId} -> YouTube ${youtubeVideoId}`,
        );
      } catch (err) {
        this.logger.error(
          `[${channel}] Publish failed for Notion ${pageId}: ${(err as Error).message}`,
        );
      }
    }
  }
}
