import { Injectable, Logger } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';
import { FetchedNewsItem } from '../news/news.service';
import { ClaudeService } from './claude.service';
import {
  AI_KOREAN_SCRIPT_SYSTEM,
  buildAiKoreanScriptUserPrompt,
} from './prompts/scripting-korean/ai.prompt';
import {
  SKIN_KOREAN_SCRIPT_SYSTEM,
  buildSkinKoreanScriptUserPrompt,
} from './prompts/scripting-korean/skin.prompt';

export interface BrollPlanEntry {
  sentenceIndex: number;
  textKo: string;
  keywordsEn: string[];
  durationSeconds: number;
}

export interface KoreanScript {
  titleKo: string;
  hookKo: string;
  scriptKo: string;
  sentencesKo: string[];
  brollPlan: BrollPlanEntry[];
}

interface RawBrollPlan {
  sentence_index: number;
  text_ko: string;
  keywords_en: string[];
  duration_seconds: number;
}

interface RawScriptResponse {
  title_ko: string;
  hook_ko: string;
  script_ko: string;
  sentences_ko: string[];
  broll_plan: RawBrollPlan[];
}

@Injectable()
export class ScriptwriterKoService {
  private readonly logger = new Logger(ScriptwriterKoService.name);

  constructor(private readonly claude: ClaudeService) {}

  async write(channel: Channel, news: FetchedNewsItem): Promise<KoreanScript> {
    this.logger.log(`Writing Korean script for ${channel}: ${news.title}`);

    const system =
      channel === Channel.AI ? AI_KOREAN_SCRIPT_SYSTEM : SKIN_KOREAN_SCRIPT_SYSTEM;
    const buildUser =
      channel === Channel.AI
        ? buildAiKoreanScriptUserPrompt
        : buildSkinKoreanScriptUserPrompt;

    const userPrompt = buildUser({
      newsContent: `${news.title}\n\n${news.description ?? ''}\n\n${news.url}`,
    });

    const raw = await this.claude.callJson<RawScriptResponse>({
      tier: 'sonnet',
      systemPrompt: system,
      userPrompt,
      adaptiveThinking: true,
      costTag: `scripting-ko-${channel.toLowerCase()}`,
    });

    if (!Array.isArray(raw.sentences_ko) || raw.sentences_ko.length === 0) {
      throw new Error('Scriptwriter returned empty sentences_ko');
    }

    return {
      titleKo: raw.title_ko,
      hookKo: raw.hook_ko,
      scriptKo: raw.script_ko,
      sentencesKo: raw.sentences_ko,
      brollPlan: raw.broll_plan.map((entry) => ({
        sentenceIndex: entry.sentence_index,
        textKo: entry.text_ko,
        keywordsEn: entry.keywords_en,
        durationSeconds: entry.duration_seconds,
      })),
    };
  }
}
