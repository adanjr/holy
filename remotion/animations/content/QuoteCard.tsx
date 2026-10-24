import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type QuoteData = {
  quote?: string;
  name?: string;
  title?: string;
  position?: string;
  quoteBackgroundColor?: string;
  authorBackgroundColor?: string;
  quoteTextColor?: string;
  authorTextColor?: string;
  backgroundImage?: string | null;
};

type CardTheme = {
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  fontFamily: string;
};

export const QuoteCard = ({
  data,
  theme,
}: {
  data: QuoteData;
  animation?: Record<string, unknown>;
  theme: CardTheme;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const authorIntro = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 18, stiffness: 100 },
  });
  const position = data.position || "center";
  const alignItems = position.includes("left")
    ? "flex-start"
    : position.includes("right")
      ? "flex-end"
      : "center";
  const justifyContent = position.includes("top")
    ? "flex-start"
    : position.includes("bottom")
      ? "flex-end"
      : "center";

  return (
    <AbsoluteFill
      style={{
        padding: 72,
        justifyContent,
        alignItems,
        backgroundColor: theme.backgroundColor,
        fontFamily: theme.fontFamily,
      }}
    >
      {data.backgroundImage && (
        <Img
          src={data.backgroundImage}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      {data.backgroundImage && (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,.48), rgba(0,0,0,.18))",
          }}
        />
      )}
      <div
        style={{
          width: 760,
          maxWidth: "86%",
          display: "flex",
          flexDirection: "column",
          alignItems,
        }}
      >
        <div
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "34px 42px",
            backgroundColor: data.quoteBackgroundColor || theme.backgroundColor,
            color: data.quoteTextColor || theme.textColor,
            borderTop: `7px solid ${theme.primaryColor}`,
            fontSize: 46,
            fontWeight: 700,
            lineHeight: 1.22,
            opacity: intro,
            transform: `translateY(${interpolate(intro, [0, 1], [28, 0])}px)`,
            boxShadow: "0 18px 50px rgba(0,0,0,.25)",
          }}
        >
          <span style={{ opacity: 0.55 }}>â€œ</span>
          {data.quote || "A meaningful quote"}
          <span style={{ opacity: 0.55 }}>â€</span>
        </div>
        <div
          style={{
            marginTop: 12,
            minWidth: 330,
            maxWidth: "72%",
            boxSizing: "border-box",
            padding: "18px 26px",
            backgroundColor: data.authorBackgroundColor || theme.primaryColor,
            color: data.authorTextColor || theme.backgroundColor,
            opacity: authorIntro,
            transform: `translateY(${interpolate(authorIntro, [0, 1], [18, 0])}px)`,
            boxShadow: "0 12px 35px rgba(0,0,0,.22)",
          }}
        >
          <div style={{ fontSize: 27, fontWeight: 700 }}>
            {data.name || "Author name"}
          </div>
          {data.title && (
            <div style={{ marginTop: 7, fontSize: 17, opacity: 0.78 }}>
              {data.title}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
