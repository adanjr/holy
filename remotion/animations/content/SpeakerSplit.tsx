import { AbsoluteFill, Img, Video, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type SpeakerSplitData = {
  src: string;
  isVideo?: boolean;
  text?: string;
  eyebrow?: string;
  speakerPosition?: "left" | "right";
  backgroundColor?: string;
  textColor?: string;
  mediaFirst?: boolean;
  items?: Array<{
    text?: string;
    order?: number;
    level?: number;
    marker?: "bullet" | "number";
  }>;
};

type SpeakerTheme = {
  backgroundColor: string;
  textColor: string;
  textSecondary: string;
  primaryColor: string;
  fontFamily: string;
};

export const SpeakerSplit = ({ data, theme }: {
  data: SpeakerSplitData;
  animation?: Record<string, unknown>;
  theme: SpeakerTheme;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mediaIn = spring({ frame, fps, config: { damping: 26, stiffness: 80 } });
  const textIn = spring({ frame: frame - 12, fps, config: { damping: 22, stiffness: 90 } });
  const splitIn = data.mediaFirst ? spring({ frame: frame - 30, fps, config: { damping: 24, stiffness: 80 } }) : 1;
  const items = (data.items || []).filter((item) => item.text);
  const orderedValues = [...new Set(items.map((item) => item.order).filter((order): order is number => typeof order === "number"))].sort((a, b) => a - b);
  const speakerOnLeft = data.speakerPosition === "left";
  const backgroundColor = data.backgroundColor || theme.backgroundColor;
  const textColor = data.textColor || theme.textColor;
  const mediaStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  };

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: speakerOnLeft ? "row" : "row-reverse", overflow: "hidden", backgroundColor, color: textColor, fontFamily: theme.fontFamily }}>
      <div style={{ position: "relative", width: `${interpolate(splitIn, [0, 1], [100, 48])}%`, flexShrink: 0, height: "100%", overflow: "hidden", opacity: mediaIn, transform: data.mediaFirst ? undefined : `translateX(${interpolate(mediaIn, [0, 1], [speakerOnLeft ? -70 : 70, 0])}px)` }}>
        {data.isVideo ? <Video src={data.src} style={mediaStyle} /> : <Img src={data.src} style={mediaStyle} />}
        <div style={{ position: "absolute", inset: 0, opacity: splitIn, background: speakerOnLeft ? `linear-gradient(90deg, transparent 68%, ${backgroundColor})` : `linear-gradient(270deg, transparent 68%, ${backgroundColor})` }} />
      </div>

      <div style={{ position: "relative", width: `${interpolate(splitIn, [0, 1], [0, 52])}%`, height: "100%", overflow: "hidden", padding: speakerOnLeft ? "70px 84px 70px 62px" : "70px 62px 70px 84px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", opacity: data.mediaFirst ? splitIn : items.length ? 1 : textIn, transform: data.mediaFirst || items.length ? undefined : `translateX(${interpolate(textIn, [0, 1], [speakerOnLeft ? 52 : -52, 0])}px)` }}>
        <div style={{ width: 62, height: 7, marginBottom: 25, backgroundColor: theme.primaryColor }} />
        {data.eyebrow && <div style={{ marginBottom: 18, color: theme.primaryColor, fontSize: 18, fontWeight: 800, letterSpacing: 3.5 }}>{data.eyebrow.toUpperCase()}</div>}
        {data.text && <div style={{ maxWidth: 570, fontSize: items.length ? 38 : 50, lineHeight: 1.15, fontWeight: 740, letterSpacing: -1.2, marginBottom: items.length ? 30 : 0 }}>{data.text}</div>}
        {items.length > 0 ? <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
          {items.map((item, index) => {
            const orderIndex = typeof item.order === "number" ? orderedValues.indexOf(item.order) : -1;
            const itemIn = orderIndex < 0 ? 1 : spring({ frame: frame - (data.mediaFirst ? 48 : 16) - orderIndex * 12, fps, config: { damping: 22, stiffness: 105 } });
            const level = Math.max(0, Math.min(3, Number(item.level || 0)));
            const marker = item.marker === "number" && typeof item.order === "number" ? `${item.order}.` : "â€¢";
            return <div key={`${item.text}-${index}`} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 10, marginLeft: level * 28, opacity: itemIn, transform: orderIndex < 0 ? undefined : `translateY(${interpolate(itemIn, [0, 1], [18, 0])}px)` }}>
              <div style={{ color: theme.primaryColor, fontSize: 25, lineHeight: 1.3, fontWeight: 800 }}>{marker}</div>
              <div style={{ color: textColor, fontSize: level ? 24 : 27, lineHeight: 1.3, fontWeight: level ? 520 : 620 }}>{item.text}</div>
            </div>;
          })}
        </div> : !data.text ? <div style={{ maxWidth: 570, fontSize: 50, lineHeight: 1.12, fontWeight: 740 }}>Your key message</div> : null}
      </div>
    </AbsoluteFill>
  );
};
