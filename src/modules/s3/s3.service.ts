import { createReadStream, createWriteStream } from 'fs';
import { pipeline as pipelineAsync } from 'stream/promises';
import { Readable } from 'stream';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UploadObjectInput {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}

export interface UploadFileInput {
  key: string;
  filePath: string;
  contentType?: string;
}

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);

  private client?: S3Client;
  private bucket?: string;
  private region!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('AWS_S3_BUCKET');
    this.region = this.config.get<string>('AWS_REGION', 'ap-northeast-2');

    if (accessKeyId && secretAccessKey && this.bucket) {
      this.client = new S3Client({
        region: this.region,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  /** Upload an in-memory buffer. Returns the s3:// URI. */
  async putObject(input: UploadObjectInput): Promise<string> {
    this.ensureConfigured();
    this.logger.log(`S3 putObject: ${input.key}`);

    await this.client!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    return `s3://${this.bucket}/${input.key}`;
  }

  /** Upload a file from disk via streaming (avoids loading large videos into memory). */
  async putFile(input: UploadFileInput): Promise<string> {
    this.ensureConfigured();
    this.logger.log(`S3 putFile: ${input.key} <- ${input.filePath}`);

    await this.client!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: createReadStream(input.filePath),
        ContentType: input.contentType,
      }),
    );
    return `s3://${this.bucket}/${input.key}`;
  }

  /**
   * Download an object to a local file path. Streams to disk — safe for large
   * videos. Returns the resolved file path.
   */
  async downloadToFile(key: string, filePath: string): Promise<string> {
    this.ensureConfigured();
    const response = await this.client!.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!response.Body) {
      throw new Error(`S3 getObject returned empty body for key=${key}`);
    }
    await pipelineAsync(response.Body as Readable, createWriteStream(filePath));
    this.logger.log(`S3 downloadToFile: ${key} -> ${filePath}`);
    return filePath;
  }

  /**
   * Parse an s3:// URI into its bucket + key parts. Returns null if the URI
   * is not an s3:// form (e.g. already a presigned URL).
   */
  parseUri(uri: string): { bucket: string; key: string } | null {
    const match = uri.match(/^s3:\/\/([^/]+)\/(.+)$/);
    return match ? { bucket: match[1], key: match[2] } : null;
  }

  /** Presign a GET URL (for Notion previews, reviewer access). Defaults to 7-day expiry. */
  async presignGet(key: string, expiresInSeconds = 7 * 24 * 60 * 60): Promise<string> {
    this.ensureConfigured();
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client!, command, { expiresIn: expiresInSeconds });
  }

  private ensureConfigured(): void {
    if (!this.client || !this.bucket) {
      throw new ServiceUnavailableException(
        'AWS S3 is not configured. Set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET in .env.',
      );
    }
  }
}
