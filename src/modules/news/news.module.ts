import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NewsService } from './news.service';
import { RssParserService } from './rss-parser.service';

@Module({
  imports: [PrismaModule],
  providers: [NewsService, RssParserService],
  exports: [NewsService],
})
export class NewsModule {}
