import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Browser, launch } from 'puppeteer';

export interface ScreenCaptureOptions {
  /** Public HTTP(S) URL to capture. */
  url: string;
  /** 9:16 portrait; matches Shorts render resolution. */
  viewportWidth?: number;
  viewportHeight?: number;
  /** Seconds to wait after load before capturing (allows lazy-loaded content). */
  settleMs?: number;
  /** Used to namespace output file. */
  key: string;
}

export interface ScreenCaptureResult {
  /** Local file path to captured PNG. */
  filePath: string;
  width: number;
  height: number;
}

const DEFAULT_VIEWPORT_W = 1080;
const DEFAULT_VIEWPORT_H = 1920;
const DEFAULT_SETTLE_MS = 1500;
const NAV_TIMEOUT_MS = 20_000;

/**
 * Headless Chromium screen capture. Used by the pipeline to grab product UI
 * screenshots from URLs the Claude scriptwriter specifies per sentence.
 *
 * Captured images are PNG stills. Real "screen recording" with interactions
 * (click/type/scroll) can be added on top of this service later.
 */
@Injectable()
export class ScreenCaptureService implements OnModuleDestroy {
  private readonly logger = new Logger(ScreenCaptureService.name);
  private browserPromise?: Promise<Browser>;

  async capture(options: ScreenCaptureOptions): Promise<ScreenCaptureResult> {
    const width = options.viewportWidth ?? DEFAULT_VIEWPORT_W;
    const height = options.viewportHeight ?? DEFAULT_VIEWPORT_H;
    const settleMs = options.settleMs ?? DEFAULT_SETTLE_MS;

    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      );

      this.logger.log(`Capture: ${options.url}`);
      await page.goto(options.url, {
        waitUntil: 'networkidle2',
        timeout: NAV_TIMEOUT_MS,
      });

      // Let lazy images/fonts load
      await new Promise((resolve) => setTimeout(resolve, settleMs));

      const outDir = join(tmpdir(), 'layer-studio-screenshots');
      await mkdir(outDir, { recursive: true });
      const filePath = join(outDir, `${options.key}.png`);

      await page.screenshot({
        path: filePath,
        type: 'png',
        clip: { x: 0, y: 0, width, height },
      });

      return { filePath, width, height };
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.logger.log('Launching headless Chromium');
      this.browserPromise = launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }
    return this.browserPromise;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browserPromise) {
      const browser = await this.browserPromise;
      await browser.close().catch(() => undefined);
      this.browserPromise = undefined;
    }
  }
}
