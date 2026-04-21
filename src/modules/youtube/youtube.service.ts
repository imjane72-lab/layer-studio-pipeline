import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';
import { YouTubeOAuthService } from './oauth.service';

export interface UploadInput {
  channel: Channel;
  title: string;
  description: string;
  tags: string[];
  videoPath: string;
  scheduledAt?: Date;
}

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);

  constructor(private readonly oauth: YouTubeOAuthService) {}

  async upload(_input: UploadInput): Promise<string> {
    this.logger.log(`YouTube upload: ${_input.title} (${_input.channel})`);
    throw new NotImplementedException('YouTube upload is not implemented yet (Phase 2).');
  }
}
