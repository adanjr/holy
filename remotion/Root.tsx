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
        const fps = 30;
        const scenes = props.scenes ?? [];

        const durationInFrames = scenes.reduce(
          (acc: number, scene: any) =>
            acc + (scene.duration || 5) * fps,
          0
        );

        return {
          durationInFrames,
          fps,
        };
      }}
      />
    </>
  );
};
