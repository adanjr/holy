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
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenes: [],
          voiceUrl: null,
        }}
       
      />
    </>
  );
};
