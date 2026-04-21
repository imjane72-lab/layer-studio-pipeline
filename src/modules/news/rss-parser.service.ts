import { Injectable, Logger, NotImplementedException } from '@nestjs/common';

@Injectable()
export class RssParserService {
  private readonly logger = new Logger(RssParserService.name);

  async parse(_feedUrl: string): Promise<unknown> {
    this.logger.log(`parse: ${_feedUrl}`);
    throw new NotImplementedException('RSS parser is not implemented yet (Phase 2).');
  }
}
