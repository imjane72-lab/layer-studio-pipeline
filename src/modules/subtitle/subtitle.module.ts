import { Module } from '@nestjs/common';
import { SentenceSplitterService } from './sentence-splitter.service';
import { SrtGeneratorService } from './srt-generator.service';
import { SubtitleService } from './subtitle.service';

@Module({
  providers: [SentenceSplitterService, SrtGeneratorService, SubtitleService],
  exports: [SentenceSplitterService, SrtGeneratorService, SubtitleService],
})
export class SubtitleModule {}
