import React from 'react';
import { AbsoluteFill } from 'remotion';
import { skinTheme } from '../themes/skin.theme';
import { BrandOverlay } from '../components/BrandOverlay';
import { Subtitle } from '../components/Subtitle';

export interface LayerSkinStudioProps {
  audioUrl: string;
  words: Array<{ word: string; startMs: number; endMs: number }>;
  bRollUrls: string[];
}

export const LayerSkinStudio: React.FC<LayerSkinStudioProps> = ({ words }) => {
  return (
    <AbsoluteFill style={{ background: skinTheme.background, fontFamily: skinTheme.fontFamily }}>
      <BrandOverlay channelName={skinTheme.channelName} accent={skinTheme.accent} />
      <Subtitle words={words} color={skinTheme.foreground} />
    </AbsoluteFill>
  );
};

export const layerSkinStudioDefaults: LayerSkinStudioProps = {
  audioUrl: '',
  words: [],
  bRollUrls: [],
};
