import React from 'react';
import { Composition } from 'remotion';
import { LayerAIStudio, layerAIStudioDefaults } from './compositions/LayerAIStudio';
import { LayerSkinStudio, layerSkinStudioDefaults } from './compositions/LayerSkinStudio';

const FPS = 30;
const DURATION_SECONDS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LayerAIStudio"
        component={LayerAIStudio}
        durationInFrames={FPS * DURATION_SECONDS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={layerAIStudioDefaults}
      />
      <Composition
        id="LayerSkinStudio"
        component={LayerSkinStudio}
        durationInFrames={FPS * DURATION_SECONDS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={layerSkinStudioDefaults}
      />
    </>
  );
};
