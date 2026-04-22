import { createReadStream } from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Channel } from '../../common/enums/channel.enum';
import { YouTubeOAuthService } from './oauth.service';

export interface CaptionUploadInput {
  channel: Channel;
  youtubeVideoId: string;
  srtPath: string;
  language: string;
  name?: string;
  isDraft?: boolean;
}

@Injectable()
export class CaptionUploadService {
  private readonly logger = new Logger(CaptionUploadService.name);

  constructor(private readonly oauth: YouTubeOAuthService) {}

  async upload(input: CaptionUploadInput): Promise<string> {
    const auth = this.oauth.getAuthClient(input.channel);
    const youtube = google.youtube({ version: 'v3', auth });

    this.logger.log(
      `Caption upload: videoId=${input.youtubeVideoId} lang=${input.language} (${input.channel})`,
    );

    const response = await youtube.captions.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          videoId: input.youtubeVideoId,
          language: input.language,
          name: input.name ?? 'English',
          isDraft: input.isDraft ?? false,
        },
      },
      media: {
        mimeType: 'application/x-subrip',
        body: createReadStream(input.srtPath),
      },
    });

    const captionId = response.data.id;
    if (!captionId) {
      throw new Error('Caption upload succeeded but returned no caption id');
    }
    this.logger.log(`Caption uploaded: ${captionId}`);
    return captionId;
  }
}
