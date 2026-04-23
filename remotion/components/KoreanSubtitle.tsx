import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SubtitleSegment {
  index: number;
  textKo: string;
  start: number; // seconds
  end: number;   // seconds
}

export type FormatLayout = 'A' | 'C';

interface KoreanSubtitleProps {
  segments: SubtitleSegment[];
  /**
   * 'A' (Informational): subtitle centered or upper-third (allows UI screenshot space below).
   * 'C' (How-to): subtitle fixed to bottom third (screen recording takes the top).
   * Default: 'A'.
   */
  format?: FormatLayout;
  color?: string;
}

/**
 * Burned-in Korean subtitle. English is uploaded separately as a YouTube
 * caption track — see docs/FORMATS.md and CLAUDE.md for the bilingual policy.
 */
export const KoreanSubtitle: React.FC<KoreanSubtitleProps> = ({
  segments,
  format = 'A',
  color = '#FFFFFF',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  const active = segments.find((s) => currentSec >= s.start && currentSec < s.end);

  if (!active) return null;

  const positionStyle: React.CSSProperties =
    format === 'C'
      ? {
          // Bottom 1/3 — screen recording occupies the top
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: '8%',
        }
      : {
          // Center-ish, slightly above middle — UI screenshot fits below
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: '35%',
        };

  return (
    <AbsoluteFill
      style={{
        ...positionStyle,
        paddingLeft: '5%',
        paddingRight: '5%',
      }}
    >
      <div
        style={{
          color,
          fontSize: 56,
          fontWeight: 700,
          fontFamily: 'Pretendard, "Apple SD Gothic Neo", system-ui, sans-serif',
          lineHeight: 1.3,
          padding: '18px 28px',
          borderRadius: 14,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          textAlign: 'center',
          maxWidth: '90%',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          wordBreak: 'keep-all',
        }}
      >
        {active.textKo}
      </div>
    </AbsoluteFill>
  );
};
