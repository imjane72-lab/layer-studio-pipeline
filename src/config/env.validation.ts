import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

// Only DATABASE_URL is strictly required — without it Prisma cannot initialize.
// Every third-party API key is optional during Phase 1 scaffolding; service stubs
// throw NotImplementedException and will read config lazily in Phase 2.
class EnvVars {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'debug';

  @IsString()
  @IsOptional()
  TZ: string = 'Asia/Seoul';

  @IsString()
  DATABASE_URL!: string;

  /**
   * When "true", the scheduler fires PipelineService.run() for both channels
   * at the configured cron time. Disabled by default so dev boots don't
   * burn API credits on unattended runs.
   */
  @IsString()
  @IsOptional()
  PIPELINE_CRON_ENABLED: string = 'false';

  // ========== Claude ==========

  @IsString()
  @IsOptional()
  ANTHROPIC_API_KEY?: string;

  @IsString()
  @IsOptional()
  CLAUDE_MODEL_HAIKU?: string;

  @IsString()
  @IsOptional()
  CLAUDE_MODEL_SONNET?: string;

  @IsInt()
  @IsOptional()
  CLAUDE_MAX_TOKENS: number = 4096;

  @IsNumber()
  @IsOptional()
  CLAUDE_TEMPERATURE: number = 0.7;

  @IsInt()
  @IsOptional()
  CLAUDE_TIMEOUT_MS: number = 60000;

  // ========== Supertone Play (Korean TTS) ==========

  @IsString()
  @IsOptional()
  SUPERTONE_API_KEY?: string;

  @IsString()
  @IsOptional()
  SUPERTONE_API_BASE: string = 'https://supertoneapi.com';

  @IsString()
  @IsOptional()
  SUPERTONE_VOICE_ID_KO?: string;

  @IsString()
  @IsOptional()
  SUPERTONE_MODEL: string = 'sona_speech_1';

  @IsString()
  @IsOptional()
  SUPERTONE_LANGUAGE: string = 'ko';

  @IsString()
  @IsOptional()
  SUPERTONE_STYLE: string = 'neutral';

  @IsNumber()
  @IsOptional()
  SUPERTONE_PITCH_SHIFT: number = 0;

  @IsNumber()
  @IsOptional()
  SUPERTONE_PITCH_VARIANCE: number = 1;

  @IsNumber()
  @IsOptional()
  SUPERTONE_SPEED: number = 1;

  @IsInt()
  @IsOptional()
  SUPERTONE_TIMEOUT_MS: number = 60000;

  @IsInt()
  @IsOptional()
  SUPERTONE_RATE_LIMIT_PER_MIN: number = 20;

  @IsInt()
  @IsOptional()
  SUPERTONE_CREDIT_WARN_THRESHOLD: number = 80000;

  // ========== Pexels ==========

  @IsString()
  @IsOptional()
  PEXELS_API_KEY?: string;

  @IsInt()
  @IsOptional()
  PEXELS_PER_PAGE: number = 15;

  @IsInt()
  @IsOptional()
  PEXELS_TIMEOUT_MS: number = 10000;

  // ========== YouTube ==========

  @IsString()
  @IsOptional()
  YOUTUBE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  YOUTUBE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  YOUTUBE_REFRESH_TOKEN_AI?: string;

  @IsString()
  @IsOptional()
  YOUTUBE_REFRESH_TOKEN_SKIN?: string;

  @IsString()
  @IsOptional()
  YOUTUBE_CHANNEL_ID_AI?: string;

  @IsString()
  @IsOptional()
  YOUTUBE_CHANNEL_ID_SKIN?: string;

  // ========== Notion ==========

  @IsString()
  @IsOptional()
  NOTION_API_KEY?: string;

  @IsString()
  @IsOptional()
  NOTION_DATABASE_ID_AI?: string;

  @IsString()
  @IsOptional()
  NOTION_DATABASE_ID_SKIN?: string;

  // ========== Slack ==========

  @IsString()
  @IsOptional()
  SLACK_WEBHOOK_URL?: string;

  @IsString()
  @IsOptional()
  SLACK_CHANNEL: string = '#layer-studio';

  // ========== AWS S3 ==========

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  AWS_REGION?: string;

  @IsString()
  @IsOptional()
  AWS_S3_BUCKET?: string;

  // ========== RSS Feeds ==========

  @IsString()
  @IsOptional()
  RSS_FEEDS_AI?: string;

  @IsString()
  @IsOptional()
  RSS_FEEDS_SKIN?: string;
}

export const validateEnv = (config: Record<string, unknown>): EnvVars => {
  const validated = plainToInstance(EnvVars, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }
  return validated;
};
