import React from 'react';
import { AbsoluteFill, OffthreadVideo } from 'remotion';

interface BRollSceneProps {
  videoUrl: string;
}

export const BRollScene: React.FC<BRollSceneProps> = ({ videoUrl }) => {
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  );
};
