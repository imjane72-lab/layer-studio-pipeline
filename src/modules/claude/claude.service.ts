import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export type ClaudeModelTier = 'haiku' | 'sonnet';

export interface ClaudeCallInput {
  tier: ClaudeModelTier;
  /** Static per-channel system prompt. Will be cached with cache_control. */
  systemPrompt: string;
  /** Dynamic per-request user content (news, Korean sentences, etc.). */
  userPrompt: string;
  /** Enable adaptive thinking (Sonnet 4.6 only). Default: false for cheaper calls. */
  adaptiveThinking?: boolean;
  maxTokens?: number;
  /** Logical tag for ApiCost tracking (e.g. "curation", "scriptwriter-ko"). */
  costTag?: string;
  /** Associate this call's cost with a video for per-video reporting. */
  videoId?: string;
}

export interface ClaudeCallOutput {
  text: string;
  tokensIn: number;
  tokensOut: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  model: string;
}

// Pricing ($ per 1M tokens) — used for rough cost estimate logged to ApiCost.
// Numbers from shared/models.md and will drift; treat as monitoring hint, not billing source of truth.
const PRICING_PER_MILLION: Record<ClaudeModelTier, { input: number; output: number }> = {
  haiku: { input: 1.0, output: 5.0 },
  sonnet: { input: 3.0, output: 15.0 },
};

@Injectable()
export class ClaudeService implements OnModuleInit {
  private readonly logger = new Logger(ClaudeService.name);

  private client?: Anthropic;
  private modelHaiku!: string;
  private modelSonnet!: string;
  private defaultMaxTokens!: number;
  private timeoutMs!: number;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.modelHaiku = this.config.get<string>('CLAUDE_MODEL_HAIKU', 'claude-haiku-4-5');
    this.modelSonnet = this.config.get<string>('CLAUDE_MODEL_SONNET', 'claude-sonnet-4-6');
    this.defaultMaxTokens = this.config.get<number>('CLAUDE_MAX_TOKENS', 4096);
    this.timeoutMs = this.config.get<number>('CLAUDE_TIMEOUT_MS', 60000);

    if (apiKey) {
      this.client = new Anthropic({ apiKey, timeout: this.timeoutMs });
    }
  }

  async call(input: ClaudeCallInput): Promise<ClaudeCallOutput> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'ANTHROPIC_API_KEY is not configured. Set it in .env before calling Claude.',
      );
    }

    const model = input.tier === 'haiku' ? this.modelHaiku : this.modelSonnet;
    const maxTokens = input.maxTokens ?? this.defaultMaxTokens;

    // Build request — types loosened via `as never` because SDK 0.30.x may not yet type
    // `thinking` or cache_control on every model, but the API accepts them.
    const request: Anthropic.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: maxTokens,
      system: [
        {
          type: 'text',
          text: input.systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ] as never,
      messages: [{ role: 'user', content: input.userPrompt }],
    };

    if (input.adaptiveThinking && input.tier === 'sonnet') {
      (request as unknown as { thinking: unknown }).thinking = { type: 'adaptive' };
    }

    const response = await this.client.messages.create(request);

    const text = this.extractText(response);
    const usage = response.usage;
    const tokensIn = usage.input_tokens;
    const tokensOut = usage.output_tokens;
    const cacheCreationTokens =
      (usage as { cache_creation_input_tokens?: number }).cache_creation_input_tokens ?? 0;
    const cacheReadTokens =
      (usage as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0;

    this.logger.log(
      `Claude ${input.tier} (${model}): in=${tokensIn} out=${tokensOut} ` +
        `cache_write=${cacheCreationTokens} cache_read=${cacheReadTokens}`,
    );

    // Fire-and-forget cost logging — don't fail the caller if DB write fails.
    this.recordCost({
      tier: input.tier,
      endpoint: input.costTag,
      tokensIn: tokensIn + cacheCreationTokens + cacheReadTokens,
      tokensOut,
      videoId: input.videoId,
    }).catch((err) => {
      this.logger.warn(`Failed to record Claude cost: ${(err as Error).message}`);
    });

    return {
      text,
      tokensIn,
      tokensOut,
      cacheCreationTokens,
      cacheReadTokens,
      model,
    };
  }

  /**
   * Call Claude and parse the response as JSON. Strips common markdown fences
   * (```json ... ```) before parsing so we tolerate either wrapped or bare JSON.
   */
  async callJson<T>(input: ClaudeCallInput): Promise<T> {
    const { text } = await this.call(input);
    return this.parseJson<T>(text);
  }

  private extractText(response: Anthropic.Message): string {
    return response.content
      .map((block) => {
        if (block.type === 'text') return block.text;
        return '';
      })
      .join('')
      .trim();
  }

  private parseJson<T>(raw: string): T {
    const cleaned = this.stripJsonFences(raw);
    try {
      return JSON.parse(cleaned) as T;
    } catch (err) {
      throw new Error(
        `Failed to parse Claude response as JSON: ${(err as Error).message}\n` +
          `--- response (first 500 chars) ---\n${raw.slice(0, 500)}`,
      );
    }
  }

  private stripJsonFences(text: string): string {
    const trimmed = text.trim();
    const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    return fenceMatch ? fenceMatch[1].trim() : trimmed;
  }

  private async recordCost(params: {
    tier: ClaudeModelTier;
    endpoint?: string;
    tokensIn: number;
    tokensOut: number;
    videoId?: string;
  }): Promise<void> {
    const pricing = PRICING_PER_MILLION[params.tier];
    const cost =
      (params.tokensIn / 1_000_000) * pricing.input +
      (params.tokensOut / 1_000_000) * pricing.output;

    await this.prisma.apiCost.create({
      data: {
        service: 'claude',
        endpoint: params.endpoint,
        tokensIn: params.tokensIn,
        tokensOut: params.tokensOut,
        cost,
        videoId: params.videoId,
      },
    });
  }
}
