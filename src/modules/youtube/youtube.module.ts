import { Module } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { YouTubeOAuthService } from './oauth.service';
import { CaptionUploadService } from './caption-upload.service';

@Module({
  providers: [YouTubeService, YouTubeOAuthService, CaptionUploadService],
  exports: [YouTubeService, CaptionUploadService],
})
export class YouTubeModule {}
