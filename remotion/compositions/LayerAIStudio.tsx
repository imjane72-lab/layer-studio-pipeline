import React from 'react';
import { AbsoluteFill } from 'remotion';
import { aiTheme } from '../themes/ai.theme';
import { BrandOverlay } from '../components/BrandOverlay';
import { BRollScene, BRollClip } from '../components/BRollScene';
import {
  KoreanSubtitle,
  SubtitleSegment,
  FormatLayout,
} from '../components/KoreanSubtitle';
import { KoreanAudio } from '../components/KoreanAudio';

export interface LayerAIStudioProps {
  audioUrl: string;
  subtitleSegments: SubtitleSegment[];
  bRollClips: BRollClip[];
  format: FormatLayout;
}

export const LayerAIStudio: React.FC<LayerAIStudioProps> = ({
  audioUrl,
  subtitleSegments,
  bRollClips,
  format,
}) => {
  return (
    <AbsoluteFill style={{ background: aiTheme.background, fontFamily: aiTheme.fontFamily }}>
      <BRollScene clips={bRollClips} />
      <BrandOverlay channelName={aiTheme.channelName} accent={aiTheme.accent} />
      <KoreanSubtitle
        segments={subtitleSegments}
        format={format}
        color={aiTheme.foreground}
      />
      <KoreanAudio audioUrl={audioUrl} />
    </AbsoluteFill>
  );
};

export const layerAIStudioDefaults: LayerAIStudioProps = {
  audioUrl: '',
  subtitleSegments: [],
  bRollClips: [],
  format: 'A',
};
