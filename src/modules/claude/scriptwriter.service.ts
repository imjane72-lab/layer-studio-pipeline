import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';
import { FetchedNewsItem } from '../news/news.service';
import { ClaudeService } from './claude.service';

export interface GeneratedScript {
  title: string;
  description: string;
  tags: string[];
  script: string;
  sentences: Array<{ text: string; keywords: string[] }>;
}

@Injectable()
export class ScriptwriterService {
  private readonly logger = new Logger(ScriptwriterService.name);

  constructor(private readonly claude: ClaudeService) {}

  async write(_channel: Channel, _news: FetchedNewsItem): Promise<GeneratedScript> {
    this.logger.log(`Writing script for ${_channel}: ${_news.title}`);
    throw new NotImplementedException('Scriptwriter is not implemented yet (Phase 2).');
  }
}
