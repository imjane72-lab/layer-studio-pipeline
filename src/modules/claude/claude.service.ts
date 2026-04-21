import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ClaudeModelTier = 'haiku' | 'sonnet';

export interface ClaudeCallInput {
  tier: ClaudeModelTier;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ClaudeCallOutput {
  text: string;
  tokensIn: number;
  tokensOut: number;
}

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);

  constructor(private readonly config: ConfigService) {}

  async call(_input: ClaudeCallInput): Promise<ClaudeCallOutput> {
    this.logger.log(`Claude call tier=${_input.tier}`);
    throw new NotImplementedException('Claude client is not implemented yet (Phase 2).');
  }
}
