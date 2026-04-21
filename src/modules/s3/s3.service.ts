import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UploadObjectInput {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly config: ConfigService) {}

  async putObject(_input: UploadObjectInput): Promise<string> {
    this.logger.log(`S3 putObject: ${_input.key}`);
    throw new NotImplementedException('S3 client is not implemented yet (Phase 2).');
  }
}
