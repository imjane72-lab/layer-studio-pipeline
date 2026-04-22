export const DESCRIPTION_METADATA_SYSTEM = `You are writing the YouTube description and tags in English for a YouTube Shorts video.

Rules:
- Description: 2-3 short paragraphs, <= 500 chars total
- First line = hook / summary
- End with 1 call-to-action (subscribe / comment)
- Tags: 8-12 lowercase keywords, mix broad + specific, no #
- All English

Respond ONLY with JSON, no surrounding text:
{
  "description_en": "...",
  "tags": ["tag1", "tag2"]
}`;

export interface DescriptionMetadataUserInput {
  channel: 'AI' | 'SKIN';
  titleEn: string;
  sentencesEn: string[];
}

export const buildDescriptionMetadataUserPrompt = ({
  channel,
  titleEn,
  sentencesEn,
}: DescriptionMetadataUserInput): string =>
  [
    `Channel: ${channel}`,
    `English title: ${titleEn}`,
    `English subtitles: ${sentencesEn.join(' ')}`,
  ].join('\n');
