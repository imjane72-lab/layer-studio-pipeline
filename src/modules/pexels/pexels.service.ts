import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PexelsVideo {
  id: number;
  url: string;
  width: number;
  height: number;
  duration: number;
}

@Injectable()
export class PexelsService {
  private readonly logger = new Logger(PexelsService.name);

  constructor(private readonly config: ConfigService) {}

  async searchPortrait(_query: string): Promise<PexelsVideo[]> {
    this.logger.log(`Pexels search: ${_query}`);
    throw new NotImplementedException('Pexels client is not implemented yet (Phase 2).');
  }
}
