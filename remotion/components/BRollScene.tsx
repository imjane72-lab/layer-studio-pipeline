import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, useVideoConfig } from 'remotion';

export interface BRollClip {
  /** One of videoUrl or imageUrl must be set. */
  videoUrl?: string;
  imageUrl?: string;
  durationSeconds: number;
}

interface BRollSceneProps {
  clips: BRollClip[];
}

/**
 * Sequential playback of B-roll clips to fill the video duration.
 *
 * Each clip is either:
 *   - a stock video from Pexels (videoUrl) — plays normally
 *   - a static article image (imageUrl) — displayed as a still for its duration
 *
 * Clips are back-to-back using <Sequence>. When no clips match, falls back
 * to a black background so rendering still succeeds.
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
            {clip.videoUrl ? (
              <OffthreadVideo
                src={clip.videoUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : clip.imageUrl ? (
              <Img
                src={clip.imageUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
