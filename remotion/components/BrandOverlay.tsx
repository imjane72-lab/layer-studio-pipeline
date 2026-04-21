import React from 'react';
import { AbsoluteFill } from 'remotion';

interface BrandOverlayProps {
  channelName: string;
  accent: string;
}

export const BrandOverlay: React.FC<BrandOverlayProps> = ({ channelName, accent }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: 48,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          padding: '8px 16px',
          background: accent,
          color: 'white',
          fontSize: 24,
          fontWeight: 700,
          borderRadius: 8,
          letterSpacing: 0.5,
        }}
      >
        {channelName}
      </div>
    </AbsoluteFill>
  );
};
