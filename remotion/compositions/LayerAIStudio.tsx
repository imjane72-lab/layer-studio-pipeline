import React from 'react';
import { AbsoluteFill } from 'remotion';
import { aiTheme } from '../themes/ai.theme';
import { BrandOverlay } from '../components/BrandOverlay';
import { Subtitle } from '../components/Subtitle';

export interface LayerAIStudioProps {
  audioUrl: string;
  words: Array<{ word: string; startMs: number; endMs: number }>;
  bRollUrls: string[];
}

export const LayerAIStudio: React.FC<LayerAIStudioProps> = ({ words }) => {
  return (
    <AbsoluteFill style={{ background: aiTheme.background, fontFamily: aiTheme.fontFamily }}>
      <BrandOverlay channelName={aiTheme.channelName} accent={aiTheme.accent} />
      <Subtitle words={words} color={aiTheme.foreground} />
    </AbsoluteFill>
  );
};

export const layerAIStudioDefaults: LayerAIStudioProps = {
  audioUrl: '',
  words: [],
  bRollUrls: [],
};
