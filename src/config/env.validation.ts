import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, validateSync } from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

class EnvVars {
  @IsEnum(NodeEnv)
  NODE_ENV!: NodeEnv;

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
  ANTHROPIC_API_KEY!: string;

  @IsString()
  CLAUDE_MODEL_HAIKU!: string;

  @IsString()
  CLAUDE_MODEL_SONNET!: string;

  @IsInt()
  @IsOptional()
  CLAUDE_MAX_TOKENS: number = 4096;

  @IsInt()
  @IsOptional()
  CLAUDE_TIMEOUT_MS: number = 60000;

  @IsString()
  ELEVENLABS_API_KEY!: string;

  @IsString()
  ELEVENLABS_VOICE_ID!: string;

  @IsString()
  @IsOptional()
  ELEVENLABS_MODEL_ID: string = 'eleven_multilingual_v2';

  @IsInt()
  @IsOptional()
  ELEVENLABS_TIMEOUT_MS: number = 120000;

  @IsString()
  PEXELS_API_KEY!: string;

  @IsInt()
  @IsOptional()
  PEXELS_PER_PAGE: number = 15;

  @IsInt()
  @IsOptional()
  PEXELS_TIMEOUT_MS: number = 10000;

  @IsString()
  YOUTUBE_CLIENT_ID!: string;

  @IsString()
  YOUTUBE_CLIENT_SECRET!: string;

  @IsString()
  YOUTUBE_REFRESH_TOKEN_AI!: string;

  @IsString()
  YOUTUBE_REFRESH_TOKEN_SKIN!: string;

  @IsString()
  YOUTUBE_CHANNEL_ID_AI!: string;

  @IsString()
  YOUTUBE_CHANNEL_ID_SKIN!: string;

  @IsString()
  NOTION_API_KEY!: string;

  @IsString()
  NOTION_DATABASE_ID_AI!: string;

  @IsString()
  NOTION_DATABASE_ID_SKIN!: string;

  @IsString()
  SLACK_WEBHOOK_URL!: string;

  @IsString()
  @IsOptional()
  SLACK_CHANNEL: string = '#layer-studio';

  @IsString()
  AWS_ACCESS_KEY_ID!: string;

  @IsString()
  AWS_SECRET_ACCESS_KEY!: string;

  @IsString()
  AWS_REGION!: string;

  @IsString()
  AWS_S3_BUCKET!: string;

  @IsString()
  RSS_FEEDS_AI!: string;

  @IsString()
  RSS_FEEDS_SKIN!: string;
}

export const validateEnv = (config: Record<string, unknown>): EnvVars => {
  const validated = plainToInstance(EnvVars, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }
  return validated;
};
