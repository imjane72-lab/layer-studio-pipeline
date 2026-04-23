/**
 * YouTube smoke test — standalone script, bypasses NestJS bootstrap.
 *
 * Usage:
 *   pnpm test:youtube
 *
 * For both AI and SKIN channels:
 *   1. Uses refresh token to obtain a fresh access token (OAuth2)
 *   2. Calls channels.list(mine=true) to fetch channel metadata
 *   3. Verifies the returned channel ID matches YOUTUBE_CHANNEL_ID_{channel}
 *   4. Prints title, subscriber count, video count, upload playlist
 *
 * Quota cost: ~2 units (channels.list is 1 unit x 2 channels).
 * No upload performed — safe to run anytime.
 *
 * Run after get-youtube-token.ts to confirm:
 *   - Refresh token + client ID + secret combination works
 *   - OAuth scopes include youtube.readonly
 *   - Channel IDs in .env match the ones the tokens authorize
 */
import 'dotenv/config';
import { google } from 'googleapis';

type Channel = 'AI' | 'SKIN';

interface ChannelConfig {
  name: Channel;
  refreshToken: string;
  expectedChannelId: string;
}

async function verifyChannel(
  clientId: string,
  clientSecret: string,
  cfg: ChannelConfig,
): Promise<void> {
  console.log(`\n━━━ ${cfg.name} channel ━━━`);

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: cfg.refreshToken });

  console.log('[1/3] Refreshing access token...');
  const tokenResp = await oauth2.getAccessToken();
  if (!tokenResp.token) {
    throw new Error('No access token returned — refresh token may be invalid');
  }
  console.log('     ✓ access token obtained');

  console.log('[2/3] Fetching channel metadata (channels.list mine=true)...');
  const youtube = google.youtube({ version: 'v3', auth: oauth2 });
  const resp = await youtube.channels.list({
    part: ['id', 'snippet', 'statistics', 'contentDetails'],
    mine: true,
  });
  const item = resp.data.items?.[0];
  if (!item) {
    throw new Error('channels.list returned no items — token has no channel?');
  }
  console.log('     ✓ channel metadata received');

  console.log('[3/3] Verifying channel ID matches .env...');
  if (item.id !== cfg.expectedChannelId) {
    throw new Error(
      `Channel ID mismatch — .env has ${cfg.expectedChannelId}, token is for ${item.id}`,
    );
  }
  console.log('     ✓ channel ID matches');

  const snippet = item.snippet;
  const stats = item.statistics;
  const upload = item.contentDetails?.relatedPlaylists?.uploads;
  console.log('');
  console.log(`   title        : ${snippet?.title ?? '(n/a)'}`);
  console.log(`   id           : ${item.id}`);
  console.log(`   subscribers  : ${stats?.subscriberCount ?? '(hidden)'}`);
  console.log(`   videos       : ${stats?.videoCount ?? '(n/a)'}`);
  console.log(`   views        : ${stats?.viewCount ?? '(n/a)'}`);
  console.log(`   uploads list : ${upload ?? '(n/a)'}`);
}

async function main(): Promise<void> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error(
      'YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET missing from .env',
    );
    process.exit(1);
  }

  const channels: ChannelConfig[] = [
    {
      name: 'AI',
      refreshToken: process.env.YOUTUBE_REFRESH_TOKEN_AI ?? '',
      expectedChannelId: process.env.YOUTUBE_CHANNEL_ID_AI ?? '',
    },
    {
      name: 'SKIN',
      refreshToken: process.env.YOUTUBE_REFRESH_TOKEN_SKIN ?? '',
      expectedChannelId: process.env.YOUTUBE_CHANNEL_ID_SKIN ?? '',
    },
  ];

  for (const cfg of channels) {
    if (!cfg.refreshToken || !cfg.expectedChannelId) {
      console.error(
        `\n❌ ${cfg.name} channel: YOUTUBE_REFRESH_TOKEN_${cfg.name} or YOUTUBE_CHANNEL_ID_${cfg.name} is empty`,
      );
      process.exit(1);
    }
    await verifyChannel(clientId, clientSecret, cfg);
  }

  console.log('\n✅ YouTube smoke test passed for both channels.');
}

main().catch((err: unknown) => {
  const e = err as { message?: string; response?: { data?: unknown } };
  console.error('\n❌ YouTube smoke test failed');
  console.error(`   ${e.message ?? String(err)}`);
  if (e.response?.data) {
    console.error(`   response: ${JSON.stringify(e.response.data).slice(0, 300)}`);
  }
  process.exit(1);
});
