import { Module } from '@nestjs/common';
import { ArticleScraperService } from './article-scraper.service';

@Module({
  providers: [ArticleScraperService],
  exports: [ArticleScraperService],
})
export class ArticleScraperModule {}
