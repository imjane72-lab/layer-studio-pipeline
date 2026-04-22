import React from 'react';
import { Audio } from 'remotion';

interface KoreanAudioProps {
  audioUrl: string;
}

/**
 * Thin wrapper around Remotion's <Audio>. Exists as a named component so the
 * composition tree clearly shows the Korean narration track (Supertone output)
 * is separate from the subtitle track.
 */
export const KoreanAudio: React.FC<KoreanAudioProps> = ({ audioUrl }) => {
  if (!audioUrl) return null;
  return <Audio src={audioUrl} />;
};
