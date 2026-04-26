import React from 'react';
import { CalculateMetadataFunction, Composition } from 'remotion';
import {
  LayerAIStudio,
  LayerAIStudioProps,
  layerAIStudioDefaults,
} from './compositions/LayerAIStudio';
import {
  LayerSkinStudio,
  LayerSkinStudioProps,
  layerSkinStudioDefaults,
} from './compositions/LayerSkinStudio';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;
const FALLBACK_DURATION_SECONDS = 60;

// Supertone's x-audio-length reports speech-only duration; the generated MP3
// usually has an extra ~0.5-1s of trailing silence per sentence. Pad generously
// so narration never cuts off.
const TAIL_PADDING_SECONDS = 3;

const calculateDuration: CalculateMetadataFunction<LayerAIStudioProps | LayerSkinStudioProps> = ({
  props,
}) => {
  const last = props.subtitleSegments[props.subtitleSegments.length - 1];
  const seconds = last ? Math.ceil(last.end) + TAIL_PADDING_SECONDS : FALLBACK_DURATION_SECONDS;
  return {
    durationInFrames: Math.max(FPS, FPS * seconds),
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LayerAIStudio"
        component={LayerAIStudio}
        durationInFrames={FPS * FALLBACK_DURATION_SECONDS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={layerAIStudioDefaults}
        calculateMetadata={calculateDuration}
      />
      <Composition
        id="LayerSkinStudio"
        component={LayerSkinStudio}
        durationInFrames={FPS * FALLBACK_DURATION_SECONDS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={layerSkinStudioDefaults}
        calculateMetadata={calculateDuration}
      />
    </>
  );
};
