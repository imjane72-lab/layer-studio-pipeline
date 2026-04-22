import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { subHours } from 'date-fns';
import { URL } from 'url';
import { Channel } from '../../common/enums/channel.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { RssParserService } from './rss-parser.service';

export interface FetchedNewsItem {
  title: string;
  description?: string;
  url: string;
  source: string;
  publishedAt: Date;
  sourceLang: 'ko' | 'en';
}

const HOURS_LOOKBACK = 48;

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly rss: RssParserService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async fetchForChannel(channel: Channel): Promise<FetchedNewsItem[]> {
    const feeds = this.feedsFor(channel);
    if (feeds.length === 0) {
      this.logger.warn(`No RSS feeds configured for ${channel}`);
      return [];
    }

    this.logger.log(`Fetching ${feeds.length} RSS feeds for ${channel}`);

    const feedResults = await Promise.all(feeds.map((url) => this.rss.parse(url)));

    const cutoff = subHours(new Date(), HOURS_LOOKBACK);
    const items: FetchedNewsItem[] = [];

    feedResults.forEach((rssItems, idx) => {
      const source = this.deriveSource(feeds[idx]);
      for (const item of rssItems) {
        if (item.publishedAt < cutoff) continue;
        items.push({
          title: item.title,
          description: item.description,
          url: item.url,
          source,
          publishedAt: item.publishedAt,
          sourceLang: this.detectLang(item.title),
        });
      }
    });

    // Dedupe by title hash and persist new items
    const byHash = new Map<string, FetchedNewsItem>();
    for (const item of items) {
      byHash.set(this.hashTitle(item.title), item);
    }

    const fresh: FetchedNewsItem[] = [];
    for (const [hash, item] of byHash.entries()) {
      const existed = await this.prisma.newsItem.findUnique({ where: { titleHash: hash } });
      if (existed) continue;

      await this.prisma.newsItem.create({
        data: {
          channel,
          title: item.title,
          description: item.description,
          url: item.url,
          source: item.source,
          publishedAt: item.publishedAt,
          titleHash: hash,
          sourceLang: item.sourceLang,
        },
      });
      fresh.push(item);
    }

    this.logger.log(
      `${channel}: fetched=${items.length} deduped=${byHash.size} new=${fresh.length}`,
    );
    return fresh;
  }

  async recentTitles(channel: Channel, limit = 20): Promise<string[]> {
    const recent = await this.prisma.newsItem.findMany({
      where: { channel, selected: true },
      orderBy: { fetchedAt: 'desc' },
      take: limit,
      select: { title: true },
    });
    return recent.map((r) => r.title);
  }

  async markSelected(url: string): Promise<void> {
    await this.prisma.newsItem.update({ where: { url }, data: { selected: true } });
  }

  private feedsFor(channel: Channel): string[] {
    const key = channel === Channel.AI ? 'RSS_FEEDS_AI' : 'RSS_FEEDS_SKIN';
    const raw = this.config.get<string>(key);
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private deriveSource(feedUrl: string): string {
    try {
      return new URL(feedUrl).hostname.replace(/^www\./, '');
    } catch {
      return feedUrl;
    }
  }

  private hashTitle(title: string): string {
    return createHash('sha256').update(title.trim().toLowerCase()).digest('hex');
  }

  /**
   * Simple language heuristic: Korean hangul block present -> 'ko', else 'en'.
   * Good enough for RSS filtering; not a real lang-detect.
   */
  private detectLang(text: string): 'ko' | 'en' {
    return /[가-힯]/.test(text) ? 'ko' : 'en';
  }
}
