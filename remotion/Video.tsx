"use client";

import { AbsoluteFill, Sequence, Audio } from "remotion";
import { Scene } from "./Scene";

type FinalCompositionProps = {  
  scenes: any[];
  voiceUrl?: string | null;
};

export const Video = ({ scenes, voiceUrl }: FinalCompositionProps) => {
  if (!scenes?.length) return null;

  let currentStartFrame = 0;
  const fps = 30;

  return (
    <AbsoluteFill className="bg-black">
      {/* 🎬 Escenas encadenadas */}
      {scenes.map((scene, index) => {
        const durationInFrames = (scene.duration || 5) * fps;

        const SceneWrapper = () => (
          <Scene scene={scene} />
        );

        const comp = (
          <Sequence
            key={scene.id || index}
            from={currentStartFrame}
            durationInFrames={durationInFrames}
          >
            <SceneWrapper />
          </Sequence>
        );

        currentStartFrame += durationInFrames;
        return comp;
      })}

      {/* 🎧 Audio sincronizado con el Player */}
      {voiceUrl && (
        <Audio
          src={voiceUrl}
          startFrom={0}
          // El audio avanza con los frames del Player (pausa/play sincronizado)
          // No se reproduce hasta que el usuario presiona Play
        />
      )}
    </AbsoluteFill>
  );
};
