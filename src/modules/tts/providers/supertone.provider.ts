import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';
import {
  TtsDurationPrediction,
  TtsProvider,
  TtsSynthesisOptions,
  TtsSynthesisResult,
} from '../tts-provider.interface';

interface SupertoneVoiceSettings {
  pitch_shift: number;
  pitch_variance: number;
  speed: number;
}

// Supertone bills ~10 credits per second of generated audio (Creator plan docs).
// We use this to estimate per-call credit cost since the synthesis endpoint
// doesn't return credits in response headers. Real-time balance is available
// from GET /v1/credits for monitoring.
const CREDITS_PER_SECOND_ESTIMATE = 10;

@Injectable()
export class SupertoneProvider implements TtsProvider, OnModuleInit {
  readonly name = 'supertone';

  private readonly logger = new Logger(SupertoneProvider.name);
  private http!: AxiosInstance;
  private limiter!: Bottleneck;

  // Cached config values
  private apiKey?: string;
  private apiBase!: string;
  private voiceIdKo?: string;
  private model!: string;
  private language!: string;
  private defaultStyle!: string;
  private defaultPitchShift!: number;
  private defaultPitchVariance!: number;
  private defaultSpeed!: number;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.apiKey = this.config.get<string>('SUPERTONE_API_KEY');
    this.apiBase = this.config.get<string>('SUPERTONE_API_BASE', 'https://supertoneapi.com');
    this.voiceIdKo = this.config.get<string>('SUPERTONE_VOICE_ID_KO');
    this.model = this.config.get<string>('SUPERTONE_MODEL', 'sona_speech_2');
    this.language = this.config.get<string>('SUPERTONE_LANGUAGE', 'ko');
    this.defaultStyle = this.config.get<string>('SUPERTONE_STYLE', '');
    this.defaultPitchShift = this.config.get<number>('SUPERTONE_PITCH_SHIFT', 0);
    this.defaultPitchVariance = this.config.get<number>('SUPERTONE_PITCH_VARIANCE', 1);
    this.defaultSpeed = this.config.get<number>('SUPERTONE_SPEED', 1);

    const timeout = this.config.get<number>('SUPERTONE_TIMEOUT_MS', 60000);
    const ratePerMin = this.config.get<number>('SUPERTONE_RATE_LIMIT_PER_MIN', 20);

    this.http = axios.create({
      baseURL: this.apiBase,
      timeout,
      headers: this.apiKey ? { 'x-sup-api-key': this.apiKey } : {},
    });

    // Bottleneck config: reservoir = ratePerMin per minute, with modest concurrency
    this.limiter = new Bottleneck({
      reservoir: ratePerMin,
      reservoirRefreshAmount: ratePerMin,
      reservoirRefreshInterval: 60 * 1000,
      maxConcurrent: 5,
    });
  }

  async synthesize(options: TtsSynthesisOptions): Promise<TtsSynthesisResult> {
    this.ensureConfigured();

    const payload = this.buildRequestBody(options);

    return this.limiter.schedule(async () => {
      try {
        const response = await this.http.post(
          `/v1/text-to-speech/${this.voiceIdKo}`,
          payload,
          { responseType: 'arraybuffer' },
        );

        // Supertone returns duration in x-audio-length header (seconds, float).
        // Credits are NOT in response headers — we estimate from duration.
        const durationHeader = response.headers['x-audio-length'];
        const contentType = response.headers['content-type'] ?? 'audio/mpeg';
        const duration = Number(durationHeader ?? 0);

        return {
          audioBuffer: Buffer.from(response.data as ArrayBuffer),
          durationSeconds: duration,
          creditsUsed: Math.ceil(duration * CREDITS_PER_SECOND_ESTIMATE),
          mimeType: String(contentType),
        };
      } catch (error) {
        throw this.wrapError(error, 'synthesize');
      }
    });
  }

  /**
   * Supertone has no dedicated predict-duration endpoint. To estimate without
   * spending credits is not possible via the public API — the only predictor
   * is character count. We approximate: ~0.1s per Korean character at speed=1.
   *
   * Use this only for rough budget checks before a full script synthesis;
   * the real duration comes from the synthesize response header.
   */
  async predictDuration(options: TtsSynthesisOptions): Promise<TtsDurationPrediction> {
    this.ensureConfigured();
    const speed = options.speed ?? this.defaultSpeed;
    const charCount = options.text.length;
    // Rough Korean heuristic: ~10 chars/sec at speed=1.0
    const durationSeconds = (charCount / 10) / speed;
    return {
      durationSeconds,
      estimatedCredits: Math.ceil(durationSeconds * CREDITS_PER_SECOND_ESTIMATE),
    };
  }

  /** Fetch current account credit balance. Useful for monitoring + pre-flight budget checks. */
  async getCreditBalance(): Promise<number> {
    this.ensureConfigured();
    const { data } = await this.http.get<{ balance: number }>('/v1/credits');
    return data.balance;
  }

  private buildRequestBody(options: TtsSynthesisOptions): Record<string, unknown> {
    const voiceSettings: SupertoneVoiceSettings = {
      pitch_shift: options.pitchShift ?? this.defaultPitchShift,
      pitch_variance: options.pitchVariance ?? this.defaultPitchVariance,
      speed: options.speed ?? this.defaultSpeed,
    };

    const body: Record<string, unknown> = {
      text: options.text,
      language: this.language,
      model: this.model,
      voice_settings: voiceSettings,
      output_format: 'mp3',
    };

    // Supertone rejects `style` for custom (cloned) voices — the voice itself
    // defines its style. Only send `style` if explicitly set to a non-empty value,
    // intended for stock voices that support style variation.
    const style = options.style ?? this.defaultStyle;
    if (style && style.length > 0) {
      body.style = style;
    }

    return body;
  }

  private ensureConfigured(): void {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'SUPERTONE_API_KEY is not configured. Set it in .env before calling TTS.',
      );
    }
    if (!this.voiceIdKo) {
      throw new ServiceUnavailableException(
        'SUPERTONE_VOICE_ID_KO is not configured. Register a clone voice at Supertone Play first.',
      );
    }
  }

  private wrapError(error: unknown, op: string): Error {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const detail = this.extractErrorDetail(error.response?.data);
      this.logger.error(`Supertone ${op} failed (status=${status}): ${detail}`);
      return new Error(`Supertone ${op} failed: ${status ?? 'network'} ${detail}`);
    }
    this.logger.error(`Supertone ${op} unexpected error`, error as Error);
    return error instanceof Error ? error : new Error(String(error));
  }

  private extractErrorDetail(data: unknown): string {
    if (!data) return 'unknown';
    if (typeof data === 'string') return data;
    if (Buffer.isBuffer(data)) {
      try {
        return data.toString('utf8').slice(0, 200);
      } catch {
        return 'binary-payload';
      }
    }
    if (data instanceof ArrayBuffer) {
      return Buffer.from(data).toString('utf8').slice(0, 200);
    }
    try {
      return JSON.stringify(data).slice(0, 200);
    } catch {
      return 'unserializable';
    }
  }
}
