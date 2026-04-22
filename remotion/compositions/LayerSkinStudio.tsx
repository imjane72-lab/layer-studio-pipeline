import React from 'react';
import { AbsoluteFill } from 'remotion';
import { skinTheme } from '../themes/skin.theme';
import { BrandOverlay } from '../components/BrandOverlay';
import { BRollScene, BRollClip } from '../components/BRollScene';
import { EnglishSubtitle, SubtitleSegment } from '../components/EnglishSubtitle';
import { KoreanAudio } from '../components/KoreanAudio';

export interface LayerSkinStudioProps {
  audioUrl: string;
  subtitleSegments: SubtitleSegment[];
  bRollClips: BRollClip[];
}

export const LayerSkinStudio: React.FC<LayerSkinStudioProps> = ({
  audioUrl,
  subtitleSegments,
  bRollClips,
}) => {
  return (
    <AbsoluteFill
      style={{ background: skinTheme.background, fontFamily: skinTheme.fontFamily }}
    >
      <BRollScene clips={bRollClips} />
      <BrandOverlay channelName={skinTheme.channelName} accent={skinTheme.accent} />
      <EnglishSubtitle segments={subtitleSegments} color={skinTheme.foreground} />
      <KoreanAudio audioUrl={audioUrl} />
    </AbsoluteFill>
  );
};

export const layerSkinStudioDefaults: LayerSkinStudioProps = {
  audioUrl: '',
  subtitleSegments: [],
  bRollClips: [],
};
