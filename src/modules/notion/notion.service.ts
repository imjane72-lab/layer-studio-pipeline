import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel } from '../../common/enums/channel.enum';

export interface NotionCardInput {
  channel: Channel;
  title: string;
  script: string;
  previewUrl: string;
}

@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name);

  constructor(private readonly config: ConfigService) {}

  async createApprovalCard(_input: NotionCardInput): Promise<string> {
    this.logger.log(`Notion card: ${_input.title} (${_input.channel})`);
    throw new NotImplementedException('Notion client is not implemented yet (Phase 2).');
  }
}
