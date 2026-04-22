import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SubtitleSegment {
  index: number;
  textKo: string;
  textEn: string;
  start: number; // seconds
  end: number;   // seconds
}

interface EnglishSubtitleProps {
  segments: SubtitleSegment[];
  color?: string;
}

export const EnglishSubtitle: React.FC<EnglishSubtitleProps> = ({
  segments,
  color = '#FFFFFF',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  const active = segments.find((s) => currentSec >= s.start && currentSec < s.end);

  if (!active) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: '15%',
        paddingLeft: '5%',
        paddingRight: '5%',
      }}
    >
      <div
        style={{
          color,
          fontSize: 48,
          fontWeight: 600,
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1.3,
          padding: '16px 24px',
          borderRadius: 12,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          textAlign: 'center',
          maxWidth: '90%',
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {active.textEn}
      </div>
    </AbsoluteFill>
  );
};
