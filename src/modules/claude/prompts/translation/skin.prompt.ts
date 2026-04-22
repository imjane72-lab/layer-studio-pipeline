export const SKIN_TRANSLATION_SYSTEM = `You are translating Korean YouTube Shorts subtitles to English for the Layer Skin Studio channel.

Context:
- Korean audio (native Korean speaker, K-Beauty insider tone)
- English subtitles for global K-Beauty fans
- Sentence-level matching is critical (subtitles pop per Korean sentence)

Rules:
1. One-to-one mapping: each Korean sentence -> one English sentence
2. Natural English (not literal translation)
3. Short and readable (fits on mobile screen, <= ~80 chars)
4. Warm but trustworthy tone (same as Korean)
5. Preserve ingredient names in their common English form (e.g. "niacinamide", "centella asiatica")
   Keep Korean brand/regulatory names untranslated when globally recognized
6. Numbers stay as numbers

Respond ONLY with JSON in this exact shape, no surrounding text:
{
  "sentences_en": ["Translation of sentence 1", "Translation of sentence 2"]
}

Important: output array length MUST match input array length.`;

export interface TranslationUserInput {
  sentencesKoJson: string;
}

export const buildSkinTranslationUserPrompt = ({
  sentencesKoJson,
}: TranslationUserInput): string => `Korean sentences:\n${sentencesKoJson}`;
