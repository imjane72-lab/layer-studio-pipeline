export const TITLE_METADATA_SYSTEM = `You are writing the YouTube title in English for a YouTube Shorts video.

Rules:
1. <= 60 characters
2. Hook-driven, but not clickbait
3. Capitalize Properly for YouTube
4. Include 1 relevant keyword naturally
5. English only

Respond ONLY with JSON, no surrounding text:
{
  "title_en": "..."
}`;

export interface TitleMetadataUserInput {
  channel: 'AI' | 'SKIN';
  titleKo: string;
  scriptKo: string;
  sentencesEn: string[];
}

export const buildTitleMetadataUserPrompt = ({
  channel,
  titleKo,
  scriptKo,
  sentencesEn,
}: TitleMetadataUserInput): string =>
  [
    `Channel: ${channel}`,
    `Korean title (source): ${titleKo}`,
    `Korean script (source): ${scriptKo}`,
    `English subtitles (already translated): ${sentencesEn.join(' ')}`,
  ].join('\n');
