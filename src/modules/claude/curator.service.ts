import { Injectable, Logger } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';
import { FetchedNewsItem } from '../news/news.service';
import { ClaudeService } from './claude.service';
import { AI_CURATION_SYSTEM, buildAiCurationUserPrompt } from './prompts/curation/ai.prompt';
import { SKIN_CURATION_SYSTEM, buildSkinCurationUserPrompt } from './prompts/curation/skin.prompt';

export type VideoFormat = 'A' | 'C';

export interface CurationResult {
  selectedItem: FetchedNewsItem;
  format: VideoFormat;
  reason: string;
  angle: string;
  brollKeywordsEn: string[];
}

interface RawCurationResponse {
  selected_id: string;
  format?: string;
  reason: string;
  angle: string;
  broll_keywords_en: string[];
}

@Injectable()
export class CuratorService {
  private readonly logger = new Logger(CuratorService.name);

  constructor(private readonly claude: ClaudeService) {}

  async selectTopic(
    channel: Channel,
    items: FetchedNewsItem[],
    recentTopics: string[] = [],
  ): Promise<CurationResult> {
    this.logger.log(`Curating ${items.length} items for ${channel}`);

    if (items.length === 0) {
      throw new Error('Cannot curate from empty news list');
    }

    const system = channel === Channel.AI ? AI_CURATION_SYSTEM : SKIN_CURATION_SYSTEM;
    const buildUser =
      channel === Channel.AI ? buildAiCurationUserPrompt : buildSkinCurationUserPrompt;

    // Tag each item with a stable id so the model can refer to it by id in the response
    const indexed = items.map((item, idx) => ({ id: String(idx), ...item }));
    const userPrompt = buildUser({
      newsItemsJson: JSON.stringify(indexed, null, 2),
      recentTopics,
    });

    const result = await this.claude.callJson<RawCurationResponse>({
      tier: 'haiku',
      systemPrompt: system,
      userPrompt,
      costTag: `curation-${channel.toLowerCase()}`,
    });

    const selectedIdx = Number(result.selected_id);
    if (!Number.isInteger(selectedIdx) || selectedIdx < 0 || selectedIdx >= items.length) {
      throw new Error(`Curator returned invalid selected_id: ${result.selected_id}`);
    }

    const format: VideoFormat = result.format === 'C' ? 'C' : 'A';
    if (result.format !== 'A' && result.format !== 'C') {
      this.logger.warn(`Curator returned unknown format "${result.format}", defaulting to A`);
    }

    return {
      selectedItem: items[selectedIdx],
      format,
      reason: result.reason,
      angle: result.angle,
      brollKeywordsEn: result.broll_keywords_en,
    };
  }
}
