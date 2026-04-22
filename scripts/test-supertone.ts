/**
 * Supertone TTS smoke test — standalone script, bypasses NestJS bootstrap.
 *
 * Usage:
 *   pnpm test:supertone
 *
 * Reads SUPERTONE_* vars from .env and:
 *   1. Prints current credit balance
 *   2. Synthesizes 3 Korean sentences with the configured voice
 *   3. Writes each clip to output/test-supertone/*.mp3
 *   4. Prints per-sentence duration + cumulative credit estimate
 *   5. Prints post-run credit balance and actual consumption
 *
 * Run once after registering a clone voice to confirm:
 *   - API key + voice ID + model combination works
 *   - Pronunciation is acceptable for mixed Korean/English content
 */
import 'dotenv/config';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import axios, { AxiosError } from 'axios';

const SAMPLE_SENTENCES = [
  'Claude는 최근 새로운 에이전트 SDK를 공개했습니다.',
  '이 SDK는 빌더 관점에서 중요한 변화입니다.',
  'GPT-5와 비교했을 때 어떤 차이가 있을까요?',
];

async function main(): Promise<void> {
  const apiKey = process.env.SUPERTONE_API_KEY;
  const voiceId = process.env.SUPERTONE_VOICE_ID_KO;
  const base = process.env.SUPERTONE_API_BASE ?? 'https://supertoneapi.com';
  const model = process.env.SUPERTONE_MODEL ?? 'sona_speech_2';
  const style = process.env.SUPERTONE_STYLE ?? '';

  if (!apiKey || !voiceId) {
    console.error('SUPERTONE_API_KEY or SUPERTONE_VOICE_ID_KO is missing from .env');
    process.exit(1);
  }

  const http = axios.create({
    baseURL: base,
    timeout: 60_000,
    headers: { 'x-sup-api-key': apiKey },
  });

  const outDir = join(process.cwd(), 'output', 'test-supertone');
  await mkdir(outDir, { recursive: true });

  // 1. Balance before
  const balanceBefore = await fetchBalance(http);
  console.log(`[balance] start: ${balanceBefore} credits`);
  console.log('');

  // 2. Synthesize each sentence
  let totalDuration = 0;

  for (const [idx, sentence] of SAMPLE_SENTENCES.entries()) {
    try {
      const body: Record<string, unknown> = {
        text: sentence,
        language: 'ko',
        model,
        voice_settings: { pitch_shift: 0, pitch_variance: 1, speed: 1 },
        output_format: 'mp3',
      };
      // Custom (cloned) voices reject `style` — only send for stock voices.
      if (style && style.length > 0) {
        body.style = style;
      }

      const response = await http.post(`/v1/text-to-speech/${voiceId}`, body, {
        responseType: 'arraybuffer',
      });

      const duration = Number(response.headers['x-audio-length'] ?? 0);
      totalDuration += duration;

      const outPath = join(outDir, `sentence_${String(idx + 1).padStart(2, '0')}.mp3`);
      await writeFile(outPath, Buffer.from(response.data));
      console.log(
        `[synth ${idx + 1}/${SAMPLE_SENTENCES.length}] ${duration.toFixed(2)}s -> ${outPath}`,
      );
    } catch (err) {
      logAxiosError(`synth ${idx + 1}`, err);
    }
  }

  console.log('');

  // 3. Balance after
  const balanceAfter = await fetchBalance(http);
  const creditsUsed = balanceBefore - balanceAfter;
  console.log(`[balance] end:   ${balanceAfter} credits`);
  console.log(`[summary] duration=${totalDuration.toFixed(2)}s actual-credits=${creditsUsed}`);
  console.log(`[summary] estimated credits/sec = ${(creditsUsed / totalDuration).toFixed(2)}`);
  console.log(`[output] ${outDir}`);
}

async function fetchBalance(http: ReturnType<typeof axios.create>): Promise<number> {
  try {
    const { data } = await http.get<{ balance: number }>('/v1/credits');
    return data.balance;
  } catch (err) {
    logAxiosError('balance', err);
    return -1;
  }
}

function logAxiosError(op: string, err: unknown): void {
  if (err instanceof AxiosError) {
    const body = err.response?.data;
    const bodyText = Buffer.isBuffer(body)
      ? body.toString('utf8').slice(0, 300)
      : JSON.stringify(body)?.slice(0, 300);
    console.error(`[${op}] HTTP ${err.response?.status}: ${bodyText}`);
    return;
  }
  console.error(`[${op}] ${(err as Error).message}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
