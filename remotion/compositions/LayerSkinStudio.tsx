import React from 'react';
import { AbsoluteFill } from 'remotion';
import { skinTheme } from '../themes/skin.theme';
import { BrandOverlay } from '../components/BrandOverlay';
import { BRollScene, BRollClip } from '../components/BRollScene';
import { KoreanSubtitle, SubtitleSegment, FormatLayout } from '../components/KoreanSubtitle';
import { KoreanAudio } from '../components/KoreanAudio';

export interface LayerSkinStudioProps {
  audioUrl: string;
  subtitleSegments: SubtitleSegment[];
  bRollClips: BRollClip[];
  format: FormatLayout;
}

export const LayerSkinStudio: React.FC<LayerSkinStudioProps> = ({
  audioUrl,
  subtitleSegments,
  bRollClips,
  format,
}) => {
  return (
    <AbsoluteFill style={{ background: skinTheme.background, fontFamily: skinTheme.fontFamily }}>
      <BRollScene clips={bRollClips} />
      <BrandOverlay channelName={skinTheme.channelName} accent={skinTheme.accent} />
      <KoreanSubtitle segments={subtitleSegments} format={format} color={skinTheme.foreground} />
      <KoreanAudio audioUrl={audioUrl} />
    </AbsoluteFill>
  );
};

export const layerSkinStudioDefaults: LayerSkinStudioProps = {
  audioUrl: '',
  subtitleSegments: [],
  bRollClips: [],
  format: 'A',
};
