import { Injectable, Logger } from '@nestjs/common';
import { SentenceSegment } from '../tts/tts.service';
import { SrtGeneratorService } from './srt-generator.service';

/**
 * Subtitle segment as persisted to the DB (`Video.subtitleSegments`) and consumed
 * by Remotion. Strips the raw audio buffer — that lives in S3 / merged MP3 only.
 */
export interface SubtitleSegment {
  index: number;
  textKo: string;
  textEn: string;
  start: number;
  end: number;
}

@Injectable()
export class SubtitleService {
  private readonly logger = new Logger(SubtitleService.name);

  constructor(private readonly srtGenerator: SrtGeneratorService) {}

  /**
   * Convert TTS sentence segments into:
   *  - `segments` to persist to `Video.subtitleSegments` (JSON) and feed Remotion
   *  - `srt` the English SRT text to upload to YouTube as the official caption
   *
   * Since Supertone is called sentence-by-sentence, timing is already correct —
   * no ElevenLabs-style word-level alignment pass needed.
   */
  buildFromTtsSegments(ttsSegments: SentenceSegment[]): {
    segments: SubtitleSegment[];
    srt: string;
  } {
    const segments: SubtitleSegment[] = ttsSegments.map((s) => ({
      index: s.index,
      textKo: s.textKo,
      textEn: s.textEn,
      start: s.start,
      end: s.end,
    }));

    const srt = this.srtGenerator.generate(
      segments.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.textEn,
      })),
    );

    this.logger.log(`Built ${segments.length} subtitle segments, SRT ${srt.length} chars`);

    return { segments, srt };
  }
}
