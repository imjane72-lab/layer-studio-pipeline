/**
 * Supertone TTS smoke test — standalone script, bypasses NestJS bootstrap.
 *
 * Usage:
 *   pnpm exec ts-node scripts/test-supertone.ts
 *
 * Reads SUPERTONE_API_KEY / SUPERTONE_VOICE_ID_KO from .env and:
 *   1. Predicts duration for a sample sentence (no credit charge)
 *   2. Synthesizes 3 short Korean sentences
 *   3. Writes each clip to output/test-supertone/*.mp3
 *   4. Prints per-sentence duration + credit usage
 *
 * Run this once after registering a clone voice in Supertone Play to confirm:
 *   - API key works
 *   - Voice ID is valid
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
  const model = process.env.SUPERTONE_MODEL ?? 'sona_speech_1';
  const style = process.env.SUPERTONE_STYLE ?? 'neutral';

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

  // 1. Predict duration for the first sentence (free)
  try {
    const predict = await http.post(`/v1/text-to-speech/${voiceId}/predict-duration`, {
      text: SAMPLE_SENTENCES[0],
      language: 'ko',
      style,
      voice_settings: { pitch_shift: 0, pitch_variance: 1, speed: 1 },
    });
    console.log(
      `[predict] "${SAMPLE_SENTENCES[0]}" -> ${predict.data.duration_seconds}s, ~${predict.data.estimated_credits} credits`,
    );
  } catch (err) {
    logAxiosError('predict', err);
  }

  // 2. Synthesize each sentence and save to disk
  let totalDuration = 0;
  let totalCredits = 0;

  for (const [idx, sentence] of SAMPLE_SENTENCES.entries()) {
    try {
      const response = await http.post(
        `/v1/text-to-speech/${voiceId}`,
        {
          text: sentence,
          language: 'ko',
          style,
          model,
          voice_settings: { pitch_shift: 0, pitch_variance: 1, speed: 1 },
          output_format: 'mp3',
        },
        { responseType: 'arraybuffer' },
      );

      const duration = Number(response.headers['x-duration-seconds'] ?? 0);
      const credits = Number(response.headers['x-credits-used'] ?? 0);
      totalDuration += duration;
      totalCredits += credits;

      const outPath = join(outDir, `sentence_${String(idx + 1).padStart(2, '0')}.mp3`);
      await writeFile(outPath, Buffer.from(response.data));
      console.log(
        `[synth ${idx + 1}/${SAMPLE_SENTENCES.length}] ${duration.toFixed(2)}s ${credits}cr -> ${outPath}`,
      );
    } catch (err) {
      logAxiosError(`synth ${idx + 1}`, err);
    }
  }

  console.log('');
  console.log(`Total: ${totalDuration.toFixed(2)}s, ${totalCredits} credits`);
  console.log(`Output dir: ${outDir}`);
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
