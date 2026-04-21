import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
}

interface SubtitleProps {
  words: WordTimestamp[];
  color?: string;
}

export const Subtitle: React.FC<SubtitleProps> = ({ words, color = '#FFFFFF' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const active = words.find((w) => currentMs >= w.startMs && currentMs <= w.endMs);

  if (!active) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 240,
      }}
    >
      <div
        style={{
          color,
          fontSize: 72,
          fontWeight: 800,
          textShadow: '0 4px 20px rgba(0,0,0,0.6)',
          padding: '16px 32px',
          textAlign: 'center',
          maxWidth: '85%',
          lineHeight: 1.2,
        }}
      >
        {active.word}
      </div>
    </AbsoluteFill>
  );
};
