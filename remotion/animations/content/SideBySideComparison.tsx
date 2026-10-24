import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type Column = { heading?: string; text?: string; tradeoff?: string };
type Data = { title?: string; left?: Column; right?: Column };
type Theme = { backgroundColor: string; textColor: string; textSecondary: string; primaryColor: string; fontFamily: string };

export const SideBySideComparison = ({ data, theme }: { data: Data; animation?: Record<string, unknown>; theme: Theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 24, stiffness: 90 } });
  const columns = [data.left || {}, data.right || {}];
  return (
    <AbsoluteFill style={{ padding: "62px 72px 68px", boxSizing: "border-box", overflow: "hidden", backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
      <div style={{ opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [22, 0])}px)` }}>
        <div style={{ width: 58, height: 6, backgroundColor: theme.primaryColor, marginBottom: 18 }} />
        <div style={{ fontSize: 48, lineHeight: 1.1, fontWeight: 760, letterSpacing: -1.2 }}>{data.title || "Short-term vs. long-term fix"}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, marginTop: 42, flex: 1 }}>
        {columns.map((column, index) => {
          const cardIn = spring({ frame: frame - 12 - index * 10, fps, config: { damping: 21, stiffness: 100 } });
          const accent = index === 0 ? theme.textSecondary : theme.primaryColor;
          return <div key={column.heading || index} style={{ minHeight: 430, borderRadius: 18, overflow: "hidden", border: `1px solid ${accent}55`, backgroundColor: `${accent}0d`, boxShadow: "0 18px 48px rgba(0,0,0,.13)", opacity: cardIn, transform: `translateX(${interpolate(cardIn, [0, 1], [index === 0 ? -48 : 48, 0])}px)` }}>
            <div style={{ padding: "22px 30px", backgroundColor: accent, color: theme.backgroundColor, fontSize: 27, fontWeight: 780 }}>{column.heading || (index === 0 ? "Short-term fix" : "Long-term fix")}</div>
            <div style={{ padding: "34px 32px" }}>
              <div style={{ fontSize: 28, lineHeight: 1.32, fontWeight: 650 }}>{column.text}</div>
              <div style={{ height: 1, backgroundColor: `${accent}55`, margin: "30px 0 25px" }} />
              <div style={{ color: accent, fontSize: 17, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 10 }}>Trade-off</div>
              <div style={{ color: theme.textSecondary, fontSize: 24, lineHeight: 1.38 }}>{column.tradeoff}</div>
            </div>
          </div>;
        })}
      </div>
    </AbsoluteFill>
  );
};
