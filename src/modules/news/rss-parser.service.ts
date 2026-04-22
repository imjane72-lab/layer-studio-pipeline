import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';

export interface ParsedRssItem {
  title: string;
  description?: string;
  url: string;
  publishedAt: Date;
}

@Injectable()
export class RssParserService {
  private readonly logger = new Logger(RssParserService.name);
  private readonly parser = new Parser({
    timeout: 10_000,
    headers: { 'User-Agent': 'LayerStudio/0.1 (+https://github.com/layer-studio)' },
  });

  /**
   * Fetch and parse a single RSS feed. Returns normalized items; never throws —
   * a bad feed yields an empty array and a warning log (one flaky source shouldn't
   * kill the whole pipeline).
   */
  async parse(feedUrl: string): Promise<ParsedRssItem[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      return (feed.items ?? [])
        .map((item): ParsedRssItem | null => {
          const url = item.link;
          const title = item.title;
          if (!url || !title) return null;

          const dateStr = item.isoDate ?? item.pubDate;
          const publishedAt = dateStr ? new Date(dateStr) : new Date();
          if (Number.isNaN(publishedAt.getTime())) return null;

          return {
            title,
            description: item.contentSnippet ?? item.content,
            url,
            publishedAt,
          };
        })
        .filter((x): x is ParsedRssItem => x !== null);
    } catch (err) {
      this.logger.warn(`RSS feed failed (${feedUrl}): ${(err as Error).message}`);
      return [];
    }
  }
}
