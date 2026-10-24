import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type PuzzleStep = { number?: string; text?: string };
type PuzzleData = { title?: string; subtitle?: string; items?: PuzzleStep[] };
type PuzzleTheme = {
  backgroundColor: string;
  textColor: string;
  textSecondary: string;
  primaryColor: string;
  palette?: string[];
  fontFamily: string;
};

// The neighboring edges are complementary: an outward tab on one piece
// occupies the inward socket on the next piece when the pieces settle.
const piecePaths = [
  "M10 10H244V65C268 59 280 72 280 95C280 118 268 131 244 125V180H10Z",
  "M30 10H244V65C268 59 280 72 280 95C280 118 268 131 244 125V180H30V125C54 131 66 118 66 95C66 72 54 59 30 65Z",
  "M30 10H270V180H30V125C54 131 66 118 66 95C66 72 54 59 30 65Z",
] as const;

export const PuzzleSteps = ({ data, theme }: {
  data: PuzzleData;
  animation?: Record<string, unknown>;
  theme: PuzzleTheme;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 24, stiffness: 90 } });
  const fallback = [
    { number: "01", text: "Reduce friction" },
    { number: "02", text: "Enable self-service" },
    { number: "03", text: "Accelerate delivery" },
  ];
  const items = [...(data.items || []), ...fallback].slice(0, 3);
  const colors = [theme.primaryColor, theme.palette?.[1] || theme.primaryColor, theme.palette?.[2] || theme.primaryColor];
  const starts = [-210, 0, 210];

  return (
    <AbsoluteFill style={{ padding: "58px 70px", boxSizing: "border-box", overflow: "hidden", backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 72%, ${theme.primaryColor}19, transparent 45%)` }} />
      <div style={{ textAlign: "center", opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [-20, 0])}px)` }}>
        <div style={{ fontSize: 58, lineHeight: 1.05, fontWeight: 780, letterSpacing: -1.6 }}>{data.title || "Internal DevEx"}</div>
        <div style={{ width: 72, height: 6, margin: "20px auto 0", backgroundColor: theme.primaryColor }} />
        {data.subtitle && <div style={{ marginTop: 15, color: theme.textSecondary, fontSize: 22 }}>{data.subtitle}</div>}
      </div>

      <div style={{ position: "absolute", left: 70, right: 70, top: 235, height: 390, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {items.map((item, index) => {
          const enter = spring({ frame: frame - 16 - index * 10, fps, config: { damping: 18, stiffness: 95 } });
          const offsetX = interpolate(enter, [0, 1], [starts[index], 0]);
          const offsetY = interpolate(enter, [0, 1], [index === 1 ? 150 : -100, 0]);
          const rotation = interpolate(enter, [0, 1], [index === 1 ? 8 : index === 0 ? -7 : 7, 0]);
          const contentInsets = [
            { left: 38, right: 82 },
            { left: 88, right: 82 },
            { left: 88, right: 38 },
          ][index];
          return (
            <div key={`${item.number}-${index}`} style={{ position: "relative", width: 350, height: 250, marginLeft: index === 0 ? 0 : -82, opacity: enter, transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) scale(${interpolate(enter, [0, 1], [0.84, 1])})`, zIndex: 3 - index }}>
              <svg viewBox="0 0 280 190" width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible", filter: "drop-shadow(0 18px 24px rgba(0,0,0,.18))" }}>
                <path d={piecePaths[index]} fill={`${colors[index]}22`} stroke={colors[index]} strokeWidth="3" strokeLinejoin="round" />
              </svg>
              <div style={{ position: "absolute", top: 34, bottom: 30, left: contentInsets.left, right: contentInsets.right, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                <div style={{ color: colors[index], fontSize: 20, fontWeight: 850, letterSpacing: 2.2 }}>{item.number || `0${index + 1}`}</div>
                <div style={{ marginTop: 14, width: "100%", fontSize: 24, lineHeight: 1.2, fontWeight: 700, overflowWrap: "break-word" }}>{item.text || fallback[index].text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
