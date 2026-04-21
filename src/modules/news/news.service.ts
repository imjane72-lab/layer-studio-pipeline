import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';
import { RssParserService } from './rss-parser.service';

export interface FetchedNewsItem {
  title: string;
  description?: string;
  url: string;
  source: string;
  publishedAt: Date;
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(private readonly rss: RssParserService) {}

  async fetchForChannel(_channel: Channel): Promise<FetchedNewsItem[]> {
    this.logger.log(`fetchForChannel: ${_channel}`);
    throw new NotImplementedException('News fetching is not implemented yet (Phase 2).');
  }
}
