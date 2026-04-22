import { Injectable } from '@nestjs/common';

/**
 * Splits Korean scripts into sentence units that line up 1:1 with English translations.
 *
 * The scriptwriter already returns a `sentences_ko` array, but we keep this as a
 * defensive fallback: if a caller only has the full `script_ko` string (e.g. manual
 * edits in Notion), we can re-derive sentence boundaries before Supertone synthesis.
 */
@Injectable()
export class SentenceSplitterService {
  private static readonly SENTENCE_BOUNDARY = /(?<=[.!?。！？])\s+|(?<=[.!?。！？])$/g;

  /**
   * Split a Korean (or English) paragraph into sentences.
   *
   * Preserves punctuation on each sentence. Collapses whitespace. Drops empty results.
   */
  split(text: string): string[] {
    if (!text) return [];

    return text
      .split(SentenceSplitterService.SENTENCE_BOUNDARY)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}
