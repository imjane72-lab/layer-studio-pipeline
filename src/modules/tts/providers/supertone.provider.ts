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

interface SupertonePredictDurationResponse {
  duration_seconds: number;
  estimated_credits: number;
}

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
    this.model = this.config.get<string>('SUPERTONE_MODEL', 'sona_speech_1');
    this.language = this.config.get<string>('SUPERTONE_LANGUAGE', 'ko');
    this.defaultStyle = this.config.get<string>('SUPERTONE_STYLE', 'neutral');
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

    const payload = this.buildRequestBody(options, { includeOutputFormat: true });

    return this.limiter.schedule(async () => {
      try {
        const response = await this.http.post(
          `/v1/text-to-speech/${this.voiceIdKo}`,
          payload,
          { responseType: 'arraybuffer' },
        );

        const durationHeader = response.headers['x-duration-seconds'];
        const creditsHeader = response.headers['x-credits-used'];
        const contentType = response.headers['content-type'] ?? 'audio/mpeg';

        return {
          audioBuffer: Buffer.from(response.data as ArrayBuffer),
          durationSeconds: Number(durationHeader ?? 0),
          creditsUsed: Number(creditsHeader ?? 0),
          mimeType: String(contentType),
        };
      } catch (error) {
        throw this.wrapError(error, 'synthesize');
      }
    });
  }

  async predictDuration(options: TtsSynthesisOptions): Promise<TtsDurationPrediction> {
    this.ensureConfigured();

    const payload = this.buildRequestBody(options, { includeOutputFormat: false });

    try {
      const { data } = await this.http.post<SupertonePredictDurationResponse>(
        `/v1/text-to-speech/${this.voiceIdKo}/predict-duration`,
        payload,
      );

      return {
        durationSeconds: data.duration_seconds,
        estimatedCredits: data.estimated_credits,
      };
    } catch (error) {
      throw this.wrapError(error, 'predictDuration');
    }
  }

  private buildRequestBody(
    options: TtsSynthesisOptions,
    { includeOutputFormat }: { includeOutputFormat: boolean },
  ): Record<string, unknown> {
    const voiceSettings: SupertoneVoiceSettings = {
      pitch_shift: options.pitchShift ?? this.defaultPitchShift,
      pitch_variance: options.pitchVariance ?? this.defaultPitchVariance,
      speed: options.speed ?? this.defaultSpeed,
    };

    const body: Record<string, unknown> = {
      text: options.text,
      language: this.language,
      style: options.style ?? this.defaultStyle,
      model: this.model,
      voice_settings: voiceSettings,
    };

    if (includeOutputFormat) {
      body.output_format = 'mp3';
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
