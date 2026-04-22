/**
 * TTS provider abstraction — allows swapping Supertone for CLOVA Voice or others.
 *
 * Strategy: sentence-by-sentence synthesis. Each call returns the audio buffer for
 * one sentence plus its duration, so the caller can build cumulative timestamps for
 * English subtitle matching.
 */

export interface TtsSynthesisOptions {
  text: string;
  // Optional per-call overrides (fall back to provider defaults when omitted)
  style?: string;
  speed?: number;
  pitchShift?: number;
  pitchVariance?: number;
}

export interface TtsSynthesisResult {
  audioBuffer: Buffer;
  durationSeconds: number;
  creditsUsed: number;
  mimeType: string; // e.g. "audio/mpeg"
}

export interface TtsDurationPrediction {
  durationSeconds: number;
  estimatedCredits: number;
}

export interface TtsProvider {
  /** Synthesize one sentence. Providers are expected to be safe to call concurrently; rate limiting is internal. */
  synthesize(options: TtsSynthesisOptions): Promise<TtsSynthesisResult>;

  /** Estimate duration + credit cost without consuming credits. Useful for budget checks before synthesis. */
  predictDuration(options: TtsSynthesisOptions): Promise<TtsDurationPrediction>;

  /** Provider name for logging / DB provider field. */
  readonly name: string;
}

export const TTS_PROVIDER = Symbol('TTS_PROVIDER');
