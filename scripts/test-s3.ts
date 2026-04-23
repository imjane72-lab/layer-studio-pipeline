/**
 * S3 smoke test — standalone script, bypasses NestJS bootstrap.
 *
 * Usage:
 *   pnpm test:s3
 *
 * Reads AWS_* vars from .env and:
 *   1. Uploads a small text object
 *   2. Downloads it back and verifies content matches
 *   3. Generates a presigned GET URL (valid 5 min)
 *   4. Deletes the test object
 *
 * Run once after creating the bucket + IAM user to confirm:
 *   - Access key + secret key are valid
 *   - IAM policy grants PutObject/GetObject/DeleteObject/ListBucket
 *   - Bucket name + region match what's in .env
 */
import 'dotenv/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function main(): Promise<void> {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION ?? 'ap-northeast-2';

  if (!accessKeyId || !secretAccessKey || !bucket) {
    console.error(
      'AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET is missing from .env',
    );
    process.exit(1);
  }

  console.log(`→ region: ${region}`);
  console.log(`→ bucket: ${bucket}`);
  console.log(`→ access key: ${accessKeyId.slice(0, 8)}...`);

  const client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const key = `smoke-test/${Date.now()}.txt`;
  const payload = `Layer Studio S3 smoke test at ${new Date().toISOString()}`;

  console.log(`\n[1/4] PutObject → ${key}`);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: payload,
      ContentType: 'text/plain; charset=utf-8',
    }),
  );
  console.log('     ✓ upload OK');

  console.log(`\n[2/4] GetObject ← ${key}`);
  const getResult = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const downloaded = await getResult.Body!.transformToString();
  if (downloaded !== payload) {
    throw new Error(
      `content mismatch — expected ${JSON.stringify(payload)}, got ${JSON.stringify(downloaded)}`,
    );
  }
  console.log('     ✓ download matches');

  console.log('\n[3/4] Presign GET URL (5 min)');
  const presignedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 5 * 60 },
  );
  console.log(`     ✓ ${presignedUrl.slice(0, 80)}...`);

  console.log(`\n[4/4] DeleteObject ${key}`);
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  console.log('     ✓ cleanup OK');

  console.log('\n✅ S3 smoke test passed.');
}

main().catch((err: unknown) => {
  const e = err as { name?: string; message?: string; Code?: string };
  console.error('\n❌ S3 smoke test failed');
  console.error(`   name: ${e.name ?? 'unknown'}`);
  console.error(`   code: ${e.Code ?? 'n/a'}`);
  console.error(`   message: ${e.message ?? String(err)}`);
  process.exit(1);
});
