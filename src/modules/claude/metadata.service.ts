import { Injectable, Logger } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';
import { ClaudeService } from './claude.service';
import {
  DESCRIPTION_METADATA_SYSTEM,
  buildDescriptionMetadataUserPrompt,
} from './prompts/metadata/description.prompt';
import {
  TITLE_METADATA_SYSTEM,
  buildTitleMetadataUserPrompt,
} from './prompts/metadata/title.prompt';

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
}

interface RawTitleResponse {
  title_ko: string;
}

interface RawDescriptionResponse {
  description_ko: string;
  tags: string[];
}

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(private readonly claude: ClaudeService) {}

  async generate(
    channel: Channel,
    input: { titleKo: string; scriptKo: string },
  ): Promise<YouTubeMetadata> {
    this.logger.log(`Generating Korean YouTube metadata for ${channel}`);

    const titleResult = await this.claude.callJson<RawTitleResponse>({
      tier: 'sonnet',
      systemPrompt: TITLE_METADATA_SYSTEM,
      userPrompt: buildTitleMetadataUserPrompt({
        channel: channel === Channel.AI ? 'AI' : 'SKIN',
        titleKo: input.titleKo,
        scriptKo: input.scriptKo,
      }),
      costTag: `metadata-title-${channel.toLowerCase()}`,
    });

    const descResult = await this.claude.callJson<RawDescriptionResponse>({
      tier: 'sonnet',
      systemPrompt: DESCRIPTION_METADATA_SYSTEM,
      userPrompt: buildDescriptionMetadataUserPrompt({
        channel: channel === Channel.AI ? 'AI' : 'SKIN',
        titleKo: titleResult.title_ko,
        scriptKo: input.scriptKo,
      }),
      costTag: `metadata-description-${channel.toLowerCase()}`,
    });

    return {
      title: titleResult.title_ko,
      description: descResult.description_ko,
      tags: descResult.tags,
    };
  }
}
