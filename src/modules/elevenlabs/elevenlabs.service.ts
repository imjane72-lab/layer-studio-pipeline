import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
}

export interface TtsResult {
  audioBase64: string;
  alignment: WordTimestamp[];
  charCount: number;
}

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);

  constructor(private readonly config: ConfigService) {}

  async synthesize(_text: string): Promise<TtsResult> {
    this.logger.log(`TTS synthesize (${_text.length} chars)`);
    throw new NotImplementedException('ElevenLabs client is not implemented yet (Phase 2).');
  }
}
