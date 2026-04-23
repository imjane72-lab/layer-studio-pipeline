/**
 * Notion smoke test — standalone script, bypasses NestJS bootstrap.
 *
 * Usage:
 *   pnpm test:notion
 *
 * Reads NOTION_* vars from .env and for both channel DBs:
 *   1. Retrieves the DB and verifies every required property exists with the
 *      correct type (Title Ko, Title En, Channel, Status, Script Ko,
 *      Script En, Description En, Tags, Video, Audio, SRT, TTS Credits,
 *      TTS Duration, Scheduled At, Approved)
 *   2. Creates a test approval card with every property populated
 *   3. Archives the test card (cleanup)
 *
 * Run after granting the Notion integration access to both databases to
 * confirm the API key has write permission and the schema matches what
 * NotionService expects.
 */
import 'dotenv/config';
import { Client } from '@notionhq/client';

interface RequiredProperty {
  name: string;
  type: string;
}

const REQUIRED_PROPERTIES: RequiredProperty[] = [
  { name: 'Title Ko', type: 'title' },
  { name: 'Title En', type: 'rich_text' },
  { name: 'Channel', type: 'select' },
  { name: 'Status', type: 'select' },
  { name: 'Script Ko', type: 'rich_text' },
  { name: 'Script En', type: 'rich_text' },
  { name: 'Description En', type: 'rich_text' },
  { name: 'Tags', type: 'multi_select' },
  { name: 'Video', type: 'url' },
  { name: 'Audio', type: 'url' },
  { name: 'SRT', type: 'url' },
  { name: 'TTS Credits', type: 'number' },
  { name: 'TTS Duration', type: 'number' },
  { name: 'Scheduled At', type: 'date' },
  { name: 'Approved', type: 'checkbox' },
];

async function verifyDatabase(
  client: Client,
  channel: 'AI' | 'SKIN',
  databaseId: string,
): Promise<void> {
  console.log(`\n━━━ ${channel} channel DB ━━━`);
  console.log(`→ database: ${databaseId}`);

  console.log(`\n[1/3] Retrieve database + verify schema`);
  const db = (await client.databases.retrieve({
    database_id: databaseId,
  })) as unknown as {
    title: { plain_text: string }[];
    properties: Record<string, { type: string }>;
  };
  const title = db.title?.[0]?.plain_text ?? '(untitled)';
  console.log(`     ✓ DB accessible: "${title}"`);

  const missing: string[] = [];
  const wrongType: string[] = [];
  for (const required of REQUIRED_PROPERTIES) {
    const actual = db.properties[required.name];
    if (!actual) {
      missing.push(required.name);
    } else if (actual.type !== required.type) {
      wrongType.push(`${required.name} (expected ${required.type}, got ${actual.type})`);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing properties: ${missing.join(', ')}`);
  }
  if (wrongType.length > 0) {
    throw new Error(`Wrong property types: ${wrongType.join('; ')}`);
  }
  console.log(`     ✓ all ${REQUIRED_PROPERTIES.length} required properties present`);

  console.log(`\n[2/3] Create test approval card`);
  const nowIso = new Date().toISOString();
  const testTitle = `[SMOKE TEST ${nowIso}] — safe to delete`;
  const page = (await client.pages.create({
    parent: { database_id: databaseId },
    properties: {
      'Title Ko': { title: [{ text: { content: testTitle } }] },
      'Title En': { rich_text: [{ text: { content: 'Smoke test card' } }] },
      Channel: { select: { name: channel } },
      Status: { select: { name: 'Pending' } },
      'Script Ko': { rich_text: [{ text: { content: '테스트 한국어 스크립트.' } }] },
      'Script En': { rich_text: [{ text: { content: 'Test English script.' } }] },
      'Description En': { rich_text: [{ text: { content: 'Test description.' } }] },
      Tags: { multi_select: [{ name: 'smoke-test' }] },
      Video: { url: 'https://example.com/video.mp4' },
      Audio: { url: 'https://example.com/audio.mp3' },
      SRT: { url: 'https://example.com/subs.srt' },
      'TTS Credits': { number: 0 },
      'TTS Duration': { number: 0 },
      'Scheduled At': { date: { start: nowIso } },
      Approved: { checkbox: false },
    } as never,
  })) as unknown as { id: string; url?: string };
  console.log(`     ✓ created page: ${page.id}`);

  console.log(`\n[3/3] Archive test card (cleanup)`);
  await client.pages.update({
    page_id: page.id,
    archived: true,
  } as never);
  console.log(`     ✓ archived`);
}

async function main(): Promise<void> {
  const apiKey = process.env.NOTION_API_KEY;
  const dbAi = process.env.NOTION_DATABASE_ID_AI;
  const dbSkin = process.env.NOTION_DATABASE_ID_SKIN;

  if (!apiKey || !dbAi || !dbSkin) {
    console.error(
      'NOTION_API_KEY / NOTION_DATABASE_ID_AI / NOTION_DATABASE_ID_SKIN is missing from .env',
    );
    process.exit(1);
  }

  const client = new Client({ auth: apiKey });

  await verifyDatabase(client, 'AI', dbAi);
  await verifyDatabase(client, 'SKIN', dbSkin);

  console.log('\n✅ Notion smoke test passed.');
}

main().catch((err: unknown) => {
  const e = err as { name?: string; message?: string; code?: string };
  console.error('\n❌ Notion smoke test failed');
  console.error(`   name: ${e.name ?? 'unknown'}`);
  console.error(`   code: ${e.code ?? 'n/a'}`);
  console.error(`   message: ${e.message ?? String(err)}`);
  process.exit(1);
});
