import { Injectable, Logger } from '@nestjs/common';
import { SentenceSegment } from '../tts/tts.service';
import { SrtGeneratorService } from './srt-generator.service';

/**
 * Subtitle segment as persisted to the DB (`Video.subtitleSegments`) and consumed
 * by Remotion. Strips the raw audio buffer — that lives in S3 / merged MP3 only.
 *
 * Korean-only. The pipeline burns Korean subtitles into the video and uploads
 * a Korean SRT as the YouTube caption track; YouTube auto-translates from
 * Korean into viewers' preferred languages.
 */
export interface SubtitleSegment {
  index: number;
  textKo: string;
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
   *  - `srt` the Korean SRT text to upload to YouTube as the official caption
   *
   * Since Supertone is called sentence-by-sentence, timing is already correct.
   */
  buildFromTtsSegments(ttsSegments: SentenceSegment[]): {
    segments: SubtitleSegment[];
    srt: string;
  } {
    const segments: SubtitleSegment[] = ttsSegments.map((s) => ({
      index: s.index,
      textKo: s.textKo,
      start: s.start,
      end: s.end,
    }));

    const srt = this.srtGenerator.generate(
      segments.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.textKo,
      })),
    );

    this.logger.log(`Built ${segments.length} subtitle segments, SRT ${srt.length} chars (ko)`);

    return { segments, srt };
  }
}
