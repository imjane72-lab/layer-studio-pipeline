import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';
import { FetchedNewsItem } from '../news/news.service';
import { ClaudeService } from './claude.service';

@Injectable()
export class CuratorService {
  private readonly logger = new Logger(CuratorService.name);

  constructor(private readonly claude: ClaudeService) {}

  async selectTopic(_channel: Channel, _items: FetchedNewsItem[]): Promise<FetchedNewsItem> {
    this.logger.log(`Curate ${_items.length} items for ${_channel}`);
    throw new NotImplementedException('Curator is not implemented yet (Phase 2).');
  }
}
