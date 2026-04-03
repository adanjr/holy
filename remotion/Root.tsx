import { Composition } from "remotion";
import { Video } from "./Video";
 
// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        // You can take the "id" to render a video:
        // npx remotion render HelloWorld
        id="Video"
        component={Video}
        durationInFrames={1}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          scenes: [],
          voiceUrl: null,
        }}
        calculateMetadata={({ props }) => {
          const scenes = props.scenes ?? [];

          const durationInFrames = Math.max(
            1,
            scenes.reduce(
              (acc: number, scene: any) =>
                acc + (scene.durationInFrames || 150), // ✅ usa el que mandas
              0
            )
          );

          return { durationInFrames, fps: 30 };
        }}
      />
    </>
  );
};
