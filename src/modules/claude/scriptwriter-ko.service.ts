import { Injectable, Logger } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';
import { FetchedNewsItem } from '../news/news.service';
import { ClaudeService } from './claude.service';
import { VideoFormat } from './curator.service';
import {
  FORMAT_A_SCRIPT_SYSTEM,
  buildFormatAUserPrompt,
} from './prompts/scripting-korean/format-a.prompt';
import {
  FORMAT_C_SCRIPT_SYSTEM,
  buildFormatCUserPrompt,
} from './prompts/scripting-korean/format-c.prompt';

export interface BrollPlanEntry {
  sentenceIndex: number;
  textKo: string;
  keywordsEn: string[];
  durationSeconds: number;
  /** Optional URL to capture as topic-specific screenshot (Puppeteer). */
  screenshotUrl?: string;
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
  screenshot_url?: string;
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

  async write(
    channel: Channel,
    format: VideoFormat,
    news: FetchedNewsItem,
  ): Promise<KoreanScript> {
    this.logger.log(
      `Writing Korean script (format=${format}) for ${channel}: ${news.title}`,
    );

    const newsContent = `${news.title}\n\n${news.description ?? ''}\n\n${news.url}`;

    const { systemPrompt, userPrompt } =
      format === 'C'
        ? {
            systemPrompt: FORMAT_C_SCRIPT_SYSTEM,
            userPrompt: buildFormatCUserPrompt({ channel, newsContent }),
          }
        : {
            systemPrompt: FORMAT_A_SCRIPT_SYSTEM,
            userPrompt: buildFormatAUserPrompt({ channel, newsContent }),
          };

    const raw = await this.claude.callJson<RawScriptResponse>({
      tier: 'sonnet',
      systemPrompt,
      userPrompt,
      costTag: `scripting-ko-${channel.toLowerCase()}-${format.toLowerCase()}`,
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
        screenshotUrl:
          entry.screenshot_url && entry.screenshot_url.startsWith('http')
            ? entry.screenshot_url
            : undefined,
      })),
    };
  }
}
