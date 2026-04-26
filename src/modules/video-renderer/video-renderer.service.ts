import { mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { Injectable, Logger } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';

export interface RenderSubtitleSegment {
  index: number;
  textKo: string;
  start: number;
  end: number;
}

export interface RenderBRollClip {
  /** One of videoUrl or imageUrl must be set. */
  videoUrl?: string;
  imageUrl?: string;
  durationSeconds: number;
}

export interface RenderInput {
  channel: Channel;
  videoId: string;
  format: 'A' | 'C';
  audioUrl: string;
  subtitleSegments: RenderSubtitleSegment[];
  bRollClips: RenderBRollClip[];
}

@Injectable()
export class VideoRendererService {
  private readonly logger = new Logger(VideoRendererService.name);

  // Cache the Remotion bundle — bundling takes a while; reuse across renders.
  private bundledPromise?: Promise<string>;

  /**
   * Render a Remotion composition to MP4 and return the local file path.
   * Caller is responsible for uploading to S3 afterwards.
   */
  async render(input: RenderInput): Promise<string> {
    this.logger.log(
      `Render video for ${input.channel} (${input.videoId}): ${input.subtitleSegments.length} sentences, ${input.bRollClips.length} clips`,
    );

    const serveUrl = await this.getBundleUrl();

    const compositionId = input.channel === Channel.AI ? 'LayerAIStudio' : 'LayerSkinStudio';

    const inputProps = {
      audioUrl: input.audioUrl,
      subtitleSegments: input.subtitleSegments,
      bRollClips: input.bRollClips,
      format: input.format,
    };

    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps,
    });

    const outputDir = resolve(process.cwd(), 'output');
    await mkdir(outputDir, { recursive: true });
    const outputPath = join(outputDir, `${input.channel.toLowerCase()}_${input.videoId}.mp4`);

    await renderMedia({
      serveUrl,
      composition,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    });

    this.logger.log(`Rendered: ${outputPath}`);
    return outputPath;
  }

  private async getBundleUrl(): Promise<string> {
    if (!this.bundledPromise) {
      this.bundledPromise = this.bundleOnce();
    }
    return this.bundledPromise;
  }

  private async bundleOnce(): Promise<string> {
    const entryPoint = resolve(process.cwd(), 'remotion/index.ts');
    const outDir = join(tmpdir(), `layer-studio-remotion-${process.pid}`);
    this.logger.log(`Bundling Remotion (entry=${entryPoint}, out=${outDir})`);
    const serveUrl = await bundle({ entryPoint, outDir });
    this.logger.log(`Bundle ready: ${serveUrl}`);
    return serveUrl;
  }
}
