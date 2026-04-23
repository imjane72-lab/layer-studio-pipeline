import { createReadStream } from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Channel } from '../../common/enums/channel.enum';
import { YouTubeOAuthService } from './oauth.service';

export interface UploadInput {
  channel: Channel;
  title: string;
  description: string;
  tags: string[];
  videoPath: string;
  scheduledAt?: Date;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
  /** YouTube category ID. Default 28 = Science & Technology. */
  categoryId?: string;
}

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);

  constructor(private readonly oauth: YouTubeOAuthService) {}

  async upload(input: UploadInput): Promise<string> {
    const auth = this.oauth.getAuthClient(input.channel);
    const youtube = google.youtube({ version: 'v3', auth });

    this.logger.log(`YouTube upload: ${input.title} (${input.channel})`);

    const scheduled = input.scheduledAt !== undefined;
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      notifySubscribers: true,
      requestBody: {
        snippet: {
          title: input.title,
          description: input.description,
          tags: input.tags,
          categoryId: input.categoryId ?? '28',
          defaultLanguage: input.defaultLanguage ?? 'ko',
          defaultAudioLanguage: input.defaultAudioLanguage ?? 'ko',
        },
        status: {
          privacyStatus: scheduled ? 'private' : 'public',
          publishAt: scheduled ? input.scheduledAt!.toISOString() : undefined,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: createReadStream(input.videoPath),
      },
    });

    const videoId = response.data.id;
    if (!videoId) {
      throw new Error('YouTube upload succeeded but returned no video id');
    }
    this.logger.log(`Uploaded: ${videoId}`);
    return videoId;
  }
}
