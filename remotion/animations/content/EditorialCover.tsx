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
  label?: string;
  headline?: string;
  subheadline?: string;
  position?: string;
  textColor?: string;
  accentColor?: string;
  overlayColor?: string;
};

type CardTheme = {
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  fontFamily: string;
};

export const EditorialCover = ({
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
    config: { damping: 30, stiffness: 70 },
  });
  const labelIn = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 20, stiffness: 110 },
  });
  const titleIn = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 20, stiffness: 95 },
  });
  const centered = data.position === "center";

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
          transform: `scale(${interpolate(imageIn, [0, 1], [1.08, 1])})`,
        }}
      />
      <AbsoluteFill
        style={{
          background: centered
            ? `linear-gradient(90deg, ${data.overlayColor || "rgba(0,0,0,.48)"}, rgba(0,0,0,.08))`
            : `linear-gradient(to top, ${data.overlayColor || "rgba(0,0,0,.9)"}, rgba(0,0,0,.4) 48%, transparent 78%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: centered ? "50%" : "auto",
          bottom: centered ? "auto" : 62,
          transform: centered ? "translateY(-50%)" : undefined,
          color: data.textColor || theme.textColor,
          textShadow: "0 4px 22px rgba(0,0,0,.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 4.5,
            opacity: labelIn,
            transform: `translateY(${interpolate(labelIn, [0, 1], [16, 0])}px)`,
          }}
        >
          <span
            style={{
              width: 42,
              height: 4,
              backgroundColor: data.accentColor || theme.primaryColor,
            }}
          />
          {(data.label || "DAILY COVER").toUpperCase()}
        </div>
        <div
          style={{
            marginTop: 24,
            maxWidth: 1040,
            fontFamily: theme.fontFamily,
            fontSize: 68,
            lineHeight: 1.02,
            fontWeight: 700,
            letterSpacing: -1.8,
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
          }}
        >
          {data.headline || "The people shaping tomorrow"}
        </div>
        {data.subheadline && (
          <div
            style={{
              marginTop: 20,
              maxWidth: 820,
              fontSize: 24,
              lineHeight: 1.35,
              opacity: interpolate(frame, [22, 42], [0, 0.9], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {data.subheadline}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
