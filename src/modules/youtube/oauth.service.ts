import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel } from '../../common/enums/channel.enum';

@Injectable()
export class YouTubeOAuthService {
  private readonly logger = new Logger(YouTubeOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  async getAccessToken(_channel: Channel): Promise<string> {
    this.logger.log(`YouTube OAuth access token for ${_channel}`);
    throw new NotImplementedException('YouTube OAuth is not implemented yet (Phase 2).');
  }
}
