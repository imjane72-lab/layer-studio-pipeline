/**
 * YouTube OAuth refresh-token helper — standalone script.
 *
 * Usage:
 *   pnpm youtube:token AI
 *   pnpm youtube:token SKIN
 *
 * Run once per channel. Make sure the browser is signed into the target
 * channel's Google account BEFORE running. Spins up a local HTTP server on
 * a random port, opens the Google consent screen, captures the auth code,
 * exchanges it for tokens, and prints the refresh_token + channel id so
 * you can paste them into .env.
 *
 * Requires YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET in .env (from Google
 * Cloud Console, OAuth client type: Desktop app).
 */
import 'dotenv/config';
import * as http from 'http';
import { exec } from 'child_process';
import { URL } from 'url';
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
];

type Channel = 'AI' | 'SKIN';

const isChannel = (v: string | undefined): v is Channel =>
  v === 'AI' || v === 'SKIN';

async function main(): Promise<void> {
  const channel = process.argv[2];
  if (!isChannel(channel)) {
    console.error('Usage: pnpm youtube:token <AI|SKIN>');
    console.error('');
    console.error('Make sure the browser is signed into the target channel');
    console.error('account before running. Run once per channel.');
    process.exit(1);
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error(
      'YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET is missing from .env',
    );
    process.exit(1);
  }

  const server = http.createServer();
  server.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine local server port');
  }
  const redirectUri = `http://localhost:${address.port}`;

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log(`\n━━━ ${channel} channel OAuth ━━━\n`);
  console.log(
    `⚠️  Make sure your browser is signed into the ${channel} channel's Google account.\n`,
  );
  console.log('Opening browser...');
  console.log(
    'If it does not open, copy and paste this URL manually:\n',
  );
  console.log(authUrl);
  console.log('');

  const openCmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start ""'
        : 'xdg-open';
  exec(`${openCmd} "${authUrl}"`);

  const code = await new Promise<string>((resolve, reject) => {
    server.on('request', (req, res) => {
      try {
        const parsed = new URL(req.url ?? '/', redirectUri);
        const err = parsed.searchParams.get('error');
        if (err) {
          res.end(`Auth failed: ${err}. You can close this tab.`);
          reject(new Error(err));
          return;
        }
        const authCode = parsed.searchParams.get('code');
        if (authCode) {
          res.end(
            'Authorization OK. You can close this tab and return to the terminal.',
          );
          resolve(authCode);
          return;
        }
        res.statusCode = 400;
        res.end('Missing code parameter.');
      } catch (e) {
        reject(e as Error);
      }
    });
  });
  server.close();

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      '\n❌ No refresh_token returned. Revoke access at https://myaccount.google.com/permissions and retry.',
    );
    process.exit(1);
  }

  oauth2.setCredentials(tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2 });
  const channelRes = await youtube.channels.list({
    part: ['id', 'snippet'],
    mine: true,
  });
  const item = channelRes.data.items?.[0];

  console.log('\n✅ Authorized successfully!\n');
  console.log(`   Channel title : ${item?.snippet?.title ?? '(unknown)'}`);
  console.log(`   Channel ID    : ${item?.id ?? '(unknown)'}`);
  console.log('');
  console.log('Paste these lines into .env (replace the empty values):\n');
  console.log(`YOUTUBE_REFRESH_TOKEN_${channel}=${tokens.refresh_token}`);
  console.log(`YOUTUBE_CHANNEL_ID_${channel}=${item?.id ?? ''}`);
  console.log('');
}

main().catch((err: unknown) => {
  const e = err as { message?: string };
  console.error('\n❌ OAuth flow failed');
  console.error(`   ${e.message ?? String(err)}`);
  process.exit(1);
});
