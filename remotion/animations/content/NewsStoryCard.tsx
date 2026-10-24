import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Data = {
  src: string;
  logo?: string | null;
  label?: string;
  headline?: string;
  summary?: string;
  outlet?: string;
  publicationDate?: string;
  textColor?: string;
  accentColor?: string;
  panelColor?: string;
};

type CardTheme = {
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  fontFamily: string;
};

export const NewsStoryCard = ({
  data,
  theme,
}: {
  data: Data;
  animation?: Record<string, unknown>;
  theme: CardTheme;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imageIn = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 65 },
  });
  const panelIn = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 22, stiffness: 95 },
  });
  const contentIn = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 20, stiffness: 105 },
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.backgroundColor,
        overflow: "hidden",
        fontFamily: theme.fontFamily,
      }}
    >
      <Img
        src={data.src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${interpolate(imageIn, [0, 1], [1.06, 1])})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,.18), rgba(0,0,0,.05)), linear-gradient(to top, rgba(0,0,0,.72), transparent 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 62,
          bottom: 54,
          width: 850,
          maxWidth: "82%",
          padding: "28px 34px 30px",
          boxSizing: "border-box",
          color: data.textColor || theme.textColor,
          backgroundColor: data.panelColor || theme.backgroundColor,
          borderTop: `7px solid ${data.accentColor || theme.primaryColor}`,
          boxShadow: "0 22px 60px rgba(0,0,0,.38)",
          opacity: panelIn,
          transform: `translateY(${interpolate(panelIn, [0, 1], [36, 0])}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 850,
              letterSpacing: 3.4,
              color: data.accentColor || theme.primaryColor,
            }}
          >
            {(data.label || "TRENDING STORY").toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minWidth: 0,
            }}
          >
            {data.logo && (
              <Img
                src={data.logo}
                style={{
                  width: 84,
                  height: 34,
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,.3))",
                }}
              />
            )}
            <div
              style={{
                textAlign: "right",
                fontSize: 15,
                lineHeight: 1.25,
                opacity: 0.76,
              }}
            >
              <strong style={{ display: "block", opacity: 1 }}>
                {data.outlet || "News Desk"}
              </strong>
              {data.publicationDate}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: theme.fontFamily,
            fontSize: 52,
            lineHeight: 1.04,
            fontWeight: 700,
            letterSpacing: -1.1,
            opacity: contentIn,
            transform: `translateY(${interpolate(contentIn, [0, 1], [22, 0])}px)`,
          }}
        >
          {data.headline || "The headline that changed the conversation"}
        </div>
        {data.summary && (
          <div
            style={{
              marginTop: 18,
              maxWidth: 745,
              fontSize: 21,
              lineHeight: 1.38,
              opacity: interpolate(frame, [25, 45], [0, 0.82], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {data.summary}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
