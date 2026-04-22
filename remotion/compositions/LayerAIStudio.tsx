import React from 'react';
import { AbsoluteFill } from 'remotion';
import { aiTheme } from '../themes/ai.theme';
import { BrandOverlay } from '../components/BrandOverlay';
import { BRollScene, BRollClip } from '../components/BRollScene';
import { EnglishSubtitle, SubtitleSegment } from '../components/EnglishSubtitle';
import { KoreanAudio } from '../components/KoreanAudio';

export interface LayerAIStudioProps {
  audioUrl: string;
  subtitleSegments: SubtitleSegment[];
  bRollClips: BRollClip[];
}

export const LayerAIStudio: React.FC<LayerAIStudioProps> = ({
  audioUrl,
  subtitleSegments,
  bRollClips,
}) => {
  return (
    <AbsoluteFill style={{ background: aiTheme.background, fontFamily: aiTheme.fontFamily }}>
      <BRollScene clips={bRollClips} />
      <BrandOverlay channelName={aiTheme.channelName} accent={aiTheme.accent} />
      <EnglishSubtitle segments={subtitleSegments} color={aiTheme.foreground} />
      <KoreanAudio audioUrl={audioUrl} />
    </AbsoluteFill>
  );
};

export const layerAIStudioDefaults: LayerAIStudioProps = {
  audioUrl: '',
  subtitleSegments: [],
  bRollClips: [],
};
