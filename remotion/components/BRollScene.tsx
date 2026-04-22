import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, useVideoConfig } from 'remotion';

export interface BRollClip {
  videoUrl: string;
  durationSeconds: number;
}

interface BRollSceneProps {
  clips: BRollClip[];
}

/**
 * Sequential playback of B-roll clips to fill the full video duration.
 *
 * Each clip plays for its allotted duration (matches `broll_plan.duration_seconds`
 * from the Korean scriptwriter output). Clips are back-to-back using <Sequence>.
 */
export const BRollScene: React.FC<BRollSceneProps> = ({ clips }) => {
  const { fps } = useVideoConfig();

  if (clips.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: '#000' }} />;
  }

  let runningFrame = 0;

  return (
    <AbsoluteFill>
      {clips.map((clip, idx) => {
        const durationInFrames = Math.max(1, Math.round(clip.durationSeconds * fps));
        const from = runningFrame;
        runningFrame += durationInFrames;
        return (
          <Sequence key={idx} from={from} durationInFrames={durationInFrames}>
            <OffthreadVideo
              src={clip.videoUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
