import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';

export interface RenderInput {
  channel: Channel;
  videoId: string;
  script: string;
  sentences: Array<{ text: string; bRollUrl: string }>;
  audioUrl: string;
  wordTimestamps: Array<{ word: string; startMs: number; endMs: number }>;
}

@Injectable()
export class VideoRendererService {
  private readonly logger = new Logger(VideoRendererService.name);

  async render(_input: RenderInput): Promise<string> {
    this.logger.log(`Render video for ${_input.channel} (${_input.videoId})`);
    throw new NotImplementedException('Remotion renderer is not implemented yet (Phase 2).');
  }
}
