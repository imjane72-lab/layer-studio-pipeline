import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { RssParserService } from './rss-parser.service';

@Module({
  providers: [NewsService, RssParserService],
  exports: [NewsService],
})
export class NewsModule {}
