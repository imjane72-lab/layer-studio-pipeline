import { Module } from '@nestjs/common';
import { PexelsService } from './pexels.service';

@Module({
  providers: [PexelsService],
  exports: [PexelsService],
})
export class PexelsModule {}
