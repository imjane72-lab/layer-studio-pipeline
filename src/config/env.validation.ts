import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, validateSync } from 'class-validator';

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

  @IsInt()
  @IsOptional()
  CLAUDE_TIMEOUT_MS: number = 60000;

  @IsString()
  @IsOptional()
  ELEVENLABS_API_KEY?: string;

  @IsString()
  @IsOptional()
  ELEVENLABS_VOICE_ID?: string;

  @IsString()
  @IsOptional()
  ELEVENLABS_MODEL_ID: string = 'eleven_multilingual_v2';

  @IsInt()
  @IsOptional()
  ELEVENLABS_TIMEOUT_MS: number = 120000;

  @IsString()
  @IsOptional()
  PEXELS_API_KEY?: string;

  @IsInt()
  @IsOptional()
  PEXELS_PER_PAGE: number = 15;

  @IsInt()
  @IsOptional()
  PEXELS_TIMEOUT_MS: number = 10000;

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

  @IsString()
  @IsOptional()
  NOTION_API_KEY?: string;

  @IsString()
  @IsOptional()
  NOTION_DATABASE_ID_AI?: string;

  @IsString()
  @IsOptional()
  NOTION_DATABASE_ID_SKIN?: string;

  @IsString()
  @IsOptional()
  SLACK_WEBHOOK_URL?: string;

  @IsString()
  @IsOptional()
  SLACK_CHANNEL: string = '#layer-studio';

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
