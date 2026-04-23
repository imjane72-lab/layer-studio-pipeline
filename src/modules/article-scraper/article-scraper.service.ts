import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface ScrapedImage {
  url: string;
  source: 'og' | 'twitter' | 'body';
}

const USER_AGENT =
  'Mozilla/5.0 (compatible; LayerStudio/1.0; +https://layer-studio.local/bot)';
const TIMEOUT_MS = 10_000;
const MAX_IMAGES = 8;
const MIN_IMAGE_SIDE = 400; // reject tiny icons / sprites

/**
 * Extract image assets from a news article URL. Used by the pipeline to find
 * topic-relevant visuals (product screenshots, hero images, etc.) beyond what
 * generic Pexels stock returns.
 */
@Injectable()
export class ArticleScraperService {
  private readonly logger = new Logger(ArticleScraperService.name);

  async scrape(articleUrl: string): Promise<ScrapedImage[]> {
    this.logger.log(`Scraping article: ${articleUrl}`);

    let html: string;
    try {
      const { data } = await axios.get<string>(articleUrl, {
        timeout: TIMEOUT_MS,
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
        responseType: 'text',
        maxRedirects: 5,
        // Don't throw for 4xx — some news sites serve 403 to bots but still include the OG tags.
        validateStatus: (s) => s < 500,
      });
      html = typeof data === 'string' ? data : String(data ?? '');
    } catch (err) {
      this.logger.warn(
        `Failed to fetch ${articleUrl}: ${(err as Error).message}. 0 images.`,
      );
      return [];
    }

    if (!html || html.length < 100) {
      this.logger.warn(`${articleUrl}: empty or tiny response body.`);
      return [];
    }

    const $ = cheerio.load(html);
    const base = new URL(articleUrl);
    const seen = new Set<string>();
    const images: ScrapedImage[] = [];

    const push = (raw: string | undefined, source: ScrapedImage['source']) => {
      if (!raw) return;
      const abs = this.absolutize(raw, base);
      if (!abs || seen.has(abs)) return;
      seen.add(abs);
      images.push({ url: abs, source });
    };

    // og:image / twitter:image first (hero)
    $('meta[property="og:image"], meta[name="og:image"]').each((_, el) => {
      push($(el).attr('content'), 'og');
    });
    $('meta[name="twitter:image"], meta[property="twitter:image"]').each(
      (_, el) => {
        push($(el).attr('content'), 'twitter');
      },
    );

    // Body images — crude but effective
    $('article img, main img, .article-body img, .content img, img').each(
      (_, el) => {
        if (images.length >= MAX_IMAGES) return;
        const src = $(el).attr('src') ?? $(el).attr('data-src');
        const width = Number($(el).attr('width')) || undefined;
        if (width && width < MIN_IMAGE_SIDE) return;
        push(src, 'body');
      },
    );

    this.logger.log(
      `${articleUrl}: ${images.length} images (og=${images.filter((i) => i.source === 'og').length}, body=${images.filter((i) => i.source === 'body').length})`,
    );

    return images.slice(0, MAX_IMAGES);
  }

  private absolutize(rawUrl: string, base: URL): string | null {
    try {
      return new URL(rawUrl, base).toString();
    } catch {
      return null;
    }
  }
}
