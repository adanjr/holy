import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type Data = { title?: string; items?: Array<{ text?: string } | string> };
type Theme = { backgroundColor: string; textColor: string; textSecondary: string; primaryColor: string; fontFamily: string };

export const BulletListSlide = ({ data, theme }: { data: Data; animation?: Record<string, unknown>; theme: Theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });
  const items = (data.items || []).slice(0, 5).map((item) => typeof item === "string" ? item : item.text || "");
  return (
    <AbsoluteFill style={{ padding: "76px 92px", boxSizing: "border-box", overflow: "hidden", backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
      <div style={{ position: "absolute", right: -160, top: -190, width: 520, height: 520, borderRadius: "50%", border: `82px solid ${theme.primaryColor}14` }} />
      <div style={{ opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [28, 0])}px)` }}>
        <div style={{ width: 64, height: 7, backgroundColor: theme.primaryColor, marginBottom: 22 }} />
        <div style={{ fontSize: 58, lineHeight: 1.08, fontWeight: 760, letterSpacing: -1.4 }}>{data.title || "In this video, you will see:"}</div>
      </div>
      <div style={{ marginTop: 58, display: "flex", flexDirection: "column", gap: 27 }}>
        {items.map((text, index) => {
          const itemIn = spring({ frame: frame - 13 - index * 12, fps, config: { damping: 21, stiffness: 105 } });
          return <div key={`${text}-${index}`} style={{ display: "grid", gridTemplateColumns: "58px 1fr", alignItems: "start", gap: 22, opacity: itemIn, transform: `translateX(${interpolate(itemIn, [0, 1], [-34, 0])}px)` }}>
            <div style={{ width: 42, height: 42, marginTop: 4, borderRadius: "50%", backgroundColor: theme.primaryColor, color: theme.backgroundColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>{index + 1}</div>
            <div style={{ fontSize: 31, lineHeight: 1.3, fontWeight: 580, color: theme.textSecondary }}>{text}</div>
          </div>;
        })}
      </div>
    </AbsoluteFill>
  );
};
