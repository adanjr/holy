import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type HubData = {
  title?: string;
  center?: string;
  nodes?: Array<{ label?: string }>;
};

type HubTheme = {
  backgroundColor: string;
  textColor: string;
  textSecondary: string;
  primaryColor: string;
  palette?: string[];
  fontFamily: string;
};

const positions = [
  { x: 255, y: 185 },
  { x: 1025, y: 185 },
  { x: 255, y: 545 },
  { x: 1025, y: 545 },
] as const;

export const HubSpokes = ({ data, theme }: {
  data: HubData;
  animation?: Record<string, unknown>;
  theme: HubTheme;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 24, stiffness: 90 } });
  const centerIn = spring({ frame: frame - 8, fps, config: { damping: 19, stiffness: 100 } });
  const fallback = ["ROI", "DORA", "MTTR", "Developer velocity"];
  const nodes = fallback.map((label, index) => data.nodes?.[index]?.label || label);
  const colors = [theme.primaryColor, theme.palette?.[1], theme.palette?.[2], theme.palette?.[3]].map((color) => color || theme.primaryColor);
  const center = { x: 640, y: 375 };
  const centerRadius = 125;
  const nodeEdgeClearance = 8;

  const connections = positions.map((position, index) => {
    const dx = position.x - center.x;
    const dy = position.y - center.y;
    const distance = Math.hypot(dx, dy);
    const unitX = dx / distance;
    const unitY = dy / distance;
    const nodeRadiusX = (index === 3 ? 285 : 220) / 2;
    const nodeRadiusY = 122 / 2;
    const ellipseDistance =
      1 /
      Math.sqrt(
        (unitX * unitX) / (nodeRadiusX * nodeRadiusX) +
          (unitY * unitY) / (nodeRadiusY * nodeRadiusY),
      );

    return {
      startX: center.x + unitX * centerRadius,
      startY: center.y + unitY * centerRadius,
      endX: position.x - unitX * (ellipseDistance + nodeEdgeClearance),
      endY: position.y - unitY * (ellipseDistance + nodeEdgeClearance),
    };
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at center, ${theme.primaryColor}18, transparent 42%)` }} />

      {data.title && (
        <div style={{ position: "absolute", top: 42, left: 80, right: 80, textAlign: "center", fontSize: 40, lineHeight: 1.1, fontWeight: 760, opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [-18, 0])}px)` }}>
          {data.title}
        </div>
      )}

      <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {positions.map((position, index) => {
          const lineIn = spring({ frame: frame - 18 - index * 7, fps, config: { damping: 24, stiffness: 90 } });
          const connection = connections[index];
          return (
            <line
              key={`line-${index}`}
              x1={connection.startX}
              y1={connection.startY}
              x2={interpolate(lineIn, [0, 1], [connection.startX, connection.endX])}
              y2={interpolate(lineIn, [0, 1], [connection.startY, connection.endY])}
              stroke={colors[index]}
              strokeWidth="4"
              strokeLinecap="round"
              opacity={0.72 * lineIn}
            />
          );
        })}
      </svg>

      <div style={{ position: "absolute", left: center.x - 125, top: center.y - 125, width: 250, height: 250, boxSizing: "border-box", borderRadius: "50%", padding: 30, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", backgroundColor: `${theme.primaryColor}20`, border: `6px solid ${theme.primaryColor}`, boxShadow: `0 20px 55px ${theme.primaryColor}2e`, fontSize: 34, lineHeight: 1.12, fontWeight: 780, opacity: centerIn, transform: `scale(${interpolate(centerIn, [0, 1], [0.62, 1])})` }}>
        {data.center || "Language of business"}
      </div>

      {positions.map((position, index) => {
        const nodeIn = spring({ frame: frame - 27 - index * 7, fps, config: { damping: 19, stiffness: 105 } });
        const width = index === 3 ? 285 : 220;
        return (
          <div key={nodes[index]} style={{ position: "absolute", left: position.x - width / 2, top: position.y - 61, width, height: 122, boxSizing: "border-box", padding: "18px 24px", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", backgroundColor: `${colors[index]}18`, border: `4px solid ${colors[index]}`, boxShadow: "0 14px 38px rgba(0,0,0,.14)", color: theme.textColor, fontSize: index === 3 ? 26 : 31, lineHeight: 1.08, fontWeight: 740, opacity: nodeIn, transform: `scale(${interpolate(nodeIn, [0, 1], [0.72, 1])})` }}>
            {nodes[index]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
