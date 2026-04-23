import { Client } from '@notionhq/client';
import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel } from '../../common/enums/channel.enum';

export interface NotionCardInput {
  channel: Channel;
  format: 'A' | 'C';
  titleKo: string;
  scriptKo: string;
  descriptionKo: string;
  tags: string[];
  videoPreviewUrl: string;
  audioPreviewUrl: string;
  subtitlePreviewUrl: string;
  ttsCredits: number;
  ttsDurationSec: number;
  scheduledAt: Date;
}

interface NotionPageCreateResponse {
  id: string;
  url?: string;
}

@Injectable()
export class NotionService implements OnModuleInit {
  private readonly logger = new Logger(NotionService.name);

  private client?: Client;
  private dbAi?: string;
  private dbSkin?: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const apiKey = this.config.get<string>('NOTION_API_KEY');
    this.dbAi = this.config.get<string>('NOTION_DATABASE_ID_AI');
    this.dbSkin = this.config.get<string>('NOTION_DATABASE_ID_SKIN');

    if (apiKey) {
      this.client = new Client({ auth: apiKey });
    }
  }

  /**
   * Find pages in the channel's DB where Approved=true and Status="Pending".
   * Used by the polling approval loop to detect reviewer sign-off without
   * relying on Notion automations (which require a paid plan).
   */
  async findApprovedPendingPages(channel: Channel): Promise<string[]> {
    this.ensureConfigured(channel);
    const databaseId = channel === Channel.AI ? this.dbAi! : this.dbSkin!;

    const response = await this.client!.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          { property: 'Approved', checkbox: { equals: true } },
          { property: 'Status', select: { equals: 'Pending' } },
        ],
      },
      page_size: 20,
    });

    return response.results.map((r) => r.id);
  }

  async updatePageStatus(
    pageId: string,
    status: 'Pending' | 'Approved' | 'Rejected' | 'Scheduled' | 'Published',
  ): Promise<void> {
    if (!this.client) {
      throw new ServiceUnavailableException('NOTION_API_KEY is not configured.');
    }
    await this.client.pages.update({
      page_id: pageId,
      properties: {
        Status: { select: { name: status } },
      } as never,
    });
  }

  async createApprovalCard(input: NotionCardInput): Promise<{ pageId: string; url: string }> {
    this.ensureConfigured(input.channel);
    const databaseId = input.channel === Channel.AI ? this.dbAi! : this.dbSkin!;

    this.logger.log(
      `Notion card: ${input.titleKo} (${input.channel}, ${input.ttsCredits} credits)`,
    );

    // Notion DB columns expected: "Title Ko" (title), "Channel", "Format",
    // "Status", "Script Ko", "Description Ko", "Tags" (multi-select),
    // "Video", "Audio", "SRT", "TTS Credits", "TTS Duration", "Scheduled At",
    // "Approved" (checkbox).
    const properties = {
      'Title Ko': { title: [{ text: { content: input.titleKo.slice(0, 2000) } }] },
      Channel: { select: { name: input.channel } },
      Format: { select: { name: input.format } },
      Status: { select: { name: 'Pending' } },
      'Script Ko': { rich_text: [{ text: { content: input.scriptKo.slice(0, 2000) } }] },
      'Description Ko': {
        rich_text: [{ text: { content: input.descriptionKo.slice(0, 2000) } }],
      },
      Tags: { multi_select: input.tags.slice(0, 16).map((name) => ({ name })) },
      Video: { url: input.videoPreviewUrl },
      Audio: { url: input.audioPreviewUrl },
      SRT: { url: input.subtitlePreviewUrl },
      'TTS Credits': { number: input.ttsCredits },
      'TTS Duration': { number: Math.round(input.ttsDurationSec) },
      'Scheduled At': { date: { start: input.scheduledAt.toISOString() } },
      Approved: { checkbox: false },
    } as const;

    const response = (await this.client!.pages.create({
      parent: { database_id: databaseId },
      properties: properties as never,
    })) as unknown as NotionPageCreateResponse;

    const url = response.url ?? `https://notion.so/${response.id.replace(/-/g, '')}`;
    return { pageId: response.id, url };
  }

  private ensureConfigured(channel: Channel): void {
    if (!this.client) {
      throw new ServiceUnavailableException('NOTION_API_KEY is not configured.');
    }
    const dbId = channel === Channel.AI ? this.dbAi : this.dbSkin;
    if (!dbId) {
      throw new ServiceUnavailableException(
        `NOTION_DATABASE_ID_${channel} is not configured.`,
      );
    }
  }
}
