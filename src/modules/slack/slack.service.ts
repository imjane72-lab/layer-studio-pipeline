import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Channel } from '../../common/enums/channel.enum';

export interface ApprovalNotificationInput {
  channel: Channel;
  titleKo: string;
  ttsDurationSec: number;
  ttsCredits: number;
  creditBudgetPerMonth: number;
  notionUrl: string;
}

@Injectable()
export class SlackService implements OnModuleInit {
  private readonly logger = new Logger(SlackService.name);

  private http!: AxiosInstance;
  private webhookUrl?: string;
  private defaultChannel!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.webhookUrl = this.config.get<string>('SLACK_WEBHOOK_URL');
    this.defaultChannel = this.config.get<string>('SLACK_CHANNEL', '#layer-studio');
    this.http = axios.create({ timeout: 10_000 });
  }

  async notify(message: string): Promise<void> {
    if (!this.webhookUrl) {
      throw new ServiceUnavailableException('SLACK_WEBHOOK_URL is not configured.');
    }
    this.logger.log(`Slack notify: ${message.slice(0, 80)}`);

    await this.http.post(this.webhookUrl, {
      channel: this.defaultChannel,
      text: message,
      mrkdwn: true,
    });
  }

  async sendUrgent(message: string): Promise<void> {
    return this.notify(`:rotating_light: URGENT: ${message}`);
  }

  formatApprovalMessage(input: ApprovalNotificationInput): string {
    const channelLabel = input.channel === Channel.AI ? 'Layer AI Studio' : 'Layer Skin Studio';
    const duration = Math.round(input.ttsDurationSec);
    const creditLine = `${input.ttsCredits} / ${input.creditBudgetPerMonth}`;
    return [
      `:clapper: *[${channelLabel}]* 새 영상 준비됨`,
      ``,
      `제목: "${input.titleKo}"`,
      ``,
      `음성 길이: ${duration}초 (${creditLine} 크레딧)`,
      ``,
      `:memo: <${input.notionUrl}|스크립트 & 미리보기 확인>`,
      `:white_check_mark: 1-2분 내 승인 필요`,
    ].join('\n');
  }
}
