import { Injectable, Logger } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';
import { ClaudeService } from './claude.service';
import {
  AI_TRANSLATION_SYSTEM,
  buildAiTranslationUserPrompt,
} from './prompts/translation/ai.prompt';
import {
  SKIN_TRANSLATION_SYSTEM,
  buildSkinTranslationUserPrompt,
} from './prompts/translation/skin.prompt';

export interface TranslationResult {
  sentencesEn: string[];
}

interface RawTranslationResponse {
  sentences_en: string[];
}

@Injectable()
export class TranslatorService {
  private readonly logger = new Logger(TranslatorService.name);

  constructor(private readonly claude: ClaudeService) {}

  /**
   * Translate Korean sentences to English, preserving 1:1 sentence-level mapping.
   * Retries once with a stricter reminder if the returned array length doesn't match —
   * without matching lengths, subtitle timing breaks downstream.
   */
  async translate(channel: Channel, sentencesKo: string[]): Promise<TranslationResult> {
    this.logger.log(`Translating ${sentencesKo.length} sentences for ${channel}`);

    if (sentencesKo.length === 0) {
      return { sentencesEn: [] };
    }

    const system = channel === Channel.AI ? AI_TRANSLATION_SYSTEM : SKIN_TRANSLATION_SYSTEM;
    const buildUser =
      channel === Channel.AI ? buildAiTranslationUserPrompt : buildSkinTranslationUserPrompt;

    const userPrompt = buildUser({
      sentencesKoJson: JSON.stringify(sentencesKo, null, 2),
    });

    const first = await this.claude.callJson<RawTranslationResponse>({
      tier: 'sonnet',
      systemPrompt: system,
      userPrompt,
      costTag: `translation-${channel.toLowerCase()}`,
    });

    if (first.sentences_en.length === sentencesKo.length) {
      return { sentencesEn: first.sentences_en };
    }

    this.logger.warn(
      `Translation length mismatch: got=${first.sentences_en.length} want=${sentencesKo.length}. Retrying.`,
    );

    const retry = await this.claude.callJson<RawTranslationResponse>({
      tier: 'sonnet',
      systemPrompt: system,
      userPrompt: `${userPrompt}\n\nIMPORTANT: Previous attempt returned ${first.sentences_en.length} sentences but input has ${sentencesKo.length}. Output EXACTLY ${sentencesKo.length} sentences — one per input sentence.`,
      costTag: `translation-${channel.toLowerCase()}-retry`,
    });

    if (retry.sentences_en.length !== sentencesKo.length) {
      throw new Error(
        `Translation length mismatch after retry: got=${retry.sentences_en.length} want=${sentencesKo.length}`,
      );
    }

    return { sentencesEn: retry.sentences_en };
  }
}
