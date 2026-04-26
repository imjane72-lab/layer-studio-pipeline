import { Inject, Injectable, Logger } from '@nestjs/common';
import { TTS_PROVIDER, TtsProvider } from './tts-provider.interface';

/**
 * One synthesized sentence — the building block that the Subtitle module later
 * turns into an SRT file and Remotion reads for on-screen text.
 *
 * `start` / `end` are cumulative seconds from the beginning of the merged audio.
 */
export interface SentenceSegment {
  index: number;
  textKo: string;
  start: number;
  end: number;
  audioBuffer: Buffer;
  creditsUsed: number;
  mimeType: string;
}

export interface SynthesizeScriptOptions {
  sentencesKo: string[];
  style?: string;
}

export interface SynthesizeScriptResult {
  segments: SentenceSegment[];
  totalDurationSec: number;
  totalCredits: number;
  provider: string;
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(@Inject(TTS_PROVIDER) private readonly provider: TtsProvider) {}

  /**
   * Synthesize a full Korean script sentence-by-sentence and return per-sentence
   * segments with cumulative timestamps.
   */
  async synthesizeScript(options: SynthesizeScriptOptions): Promise<SynthesizeScriptResult> {
    const { sentencesKo, style } = options;

    this.logger.log(`Synthesizing ${sentencesKo.length} sentences via ${this.provider.name}`);

    const results = await Promise.all(
      sentencesKo.map((text) => this.provider.synthesize({ text, style })),
    );

    const segments: SentenceSegment[] = [];
    let cumulativeTime = 0;
    let totalCredits = 0;

    for (const [index, result] of results.entries()) {
      const start = cumulativeTime;
      const end = start + result.durationSeconds;
      segments.push({
        index,
        textKo: sentencesKo[index],
        start,
        end,
        audioBuffer: result.audioBuffer,
        creditsUsed: result.creditsUsed,
        mimeType: result.mimeType,
      });
      cumulativeTime = end;
      totalCredits += result.creditsUsed;
    }

    this.logger.log(
      `Synthesis complete: duration=${cumulativeTime.toFixed(2)}s credits=${totalCredits}`,
    );

    return {
      segments,
      totalDurationSec: cumulativeTime,
      totalCredits,
      provider: this.provider.name,
    };
  }

  /**
   * Estimate credits for a script without consuming them. Use before synthesizeScript
   * to gate on budget.
   */
  async predictScriptCost(sentencesKo: string[]): Promise<{
    totalDurationSec: number;
    totalCredits: number;
  }> {
    const predictions = await Promise.all(
      sentencesKo.map((text) => this.provider.predictDuration({ text })),
    );

    return {
      totalDurationSec: predictions.reduce((sum, p) => sum + p.durationSeconds, 0),
      totalCredits: predictions.reduce((sum, p) => sum + p.estimatedCredits, 0),
    };
  }
}
