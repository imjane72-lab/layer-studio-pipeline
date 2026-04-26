import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { Channel } from '../../common/enums/channel.enum';

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

@Injectable()
export class YouTubeOAuthService implements OnModuleInit {
  private readonly logger = new Logger(YouTubeOAuthService.name);

  private clientId?: string;
  private clientSecret?: string;
  private refreshTokens: Record<Channel, string | undefined> = {
    [Channel.AI]: undefined,
    [Channel.SKIN]: undefined,
  };
  private oauthClients: Partial<Record<Channel, OAuth2Client>> = {};

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.clientId = this.config.get<string>('YOUTUBE_CLIENT_ID');
    this.clientSecret = this.config.get<string>('YOUTUBE_CLIENT_SECRET');
    this.refreshTokens = {
      [Channel.AI]: this.config.get<string>('YOUTUBE_REFRESH_TOKEN_AI'),
      [Channel.SKIN]: this.config.get<string>('YOUTUBE_REFRESH_TOKEN_SKIN'),
    };
  }

  /**
   * Returns an OAuth2Client authenticated for the given channel, ready to pass
   * into googleapis endpoints. google-auth-library handles access token refresh
   * internally using the stored refresh_token.
   */
  getAuthClient(channel: Channel): OAuth2Client {
    const cached = this.oauthClients[channel];
    if (cached) return cached;

    if (!this.clientId || !this.clientSecret) {
      throw new ServiceUnavailableException(
        'YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET are not configured.',
      );
    }
    const refreshToken = this.refreshTokens[channel];
    if (!refreshToken) {
      throw new ServiceUnavailableException(
        `YOUTUBE_REFRESH_TOKEN_${channel} is not configured. Run scripts/get-youtube-token.ts first.`,
      );
    }

    const client = new google.auth.OAuth2({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    client.setCredentials({ refresh_token: refreshToken });

    this.oauthClients[channel] = client;
    return client;
  }
}
