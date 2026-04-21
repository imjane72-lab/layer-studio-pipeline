import { Module } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { YouTubeOAuthService } from './oauth.service';

@Module({
  providers: [YouTubeService, YouTubeOAuthService],
  exports: [YouTubeService],
})
export class YouTubeModule {}
