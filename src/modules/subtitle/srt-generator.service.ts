import { Injectable } from '@nestjs/common';

export interface SrtSegmentInput {
  start: number; // seconds
  end: number; // seconds
  text: string;
}

@Injectable()
export class SrtGeneratorService {
  /**
   * Build an SRT-format string from sentence-level segments.
   *
   * Sentence-based output (not word-based): each entry shows one full sentence
   * for the whole Korean audio sentence duration. Matches the YouTube Shorts
   * reading cadence and is what the caption upload step sends to YouTube as the
   * official English caption track.
   */
  generate(segments: SrtSegmentInput[]): string {
    return segments
      .map((seg, i) => {
        const cueNumber = i + 1;
        const start = this.formatTimestamp(seg.start);
        const end = this.formatTimestamp(seg.end);
        return `${cueNumber}\n${start} --> ${end}\n${seg.text}\n`;
      })
      .join('\n');
  }

  private formatTimestamp(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = Math.floor(safe % 60);
    const milliseconds = Math.round((safe - Math.floor(safe)) * 1000);

    return (
      [this.pad(hours, 2), this.pad(minutes, 2), this.pad(seconds, 2)].join(':') +
      `,${this.pad(milliseconds, 3)}`
    );
  }

  private pad(n: number, width: number): string {
    return n.toString().padStart(width, '0');
  }
}
