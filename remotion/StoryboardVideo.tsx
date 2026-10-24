"use client";

import { Composition, Sequence } from "remotion";
import { Scene } from "./Scene";

type StoryboardVideoProps = {
  storyboard: any;
};

export const StoryboardVideo: React.FC<StoryboardVideoProps> = ({ storyboard }) => {
  const fps = 30;

  return (
    <Composition
      id="StoryboardVideo"
      component={() => (
        <>
          {storyboard.scenes.map((scene: any, idx: number) => (
            <Sequence
              key={scene.id}
              from={scene.startTime ? Math.floor(scene.startTime * fps) : idx * 150}
              durationInFrames={
                scene.duration ? Math.floor(scene.duration * fps) : 150
              }
            >
              <Scene scene={scene} />
              {/* <Scene
                imageUrl={scene.imageUrl}
                videoUrl={scene.videoUrl}
                narration={scene.narration}
                description={scene.description}
              /> */}
            </Sequence>
          ))}
        </>
      )}
      durationInFrames={
        storyboard.scenes.reduce(
          (acc: number, s: any) => acc + (s.duration ? s.duration * fps : 150),
          0
        )
      }
      fps={fps}
      width={1280}
      height={720}
    />
  );
};
