import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type FeatureIcon = "search" | "document" | "wrench" | "chart" | "people" | "idea";

type FeatureCardsData = {
  title?: string;
  subtitle?: string;
  items?: Array<{ icon?: FeatureIcon; text?: string }>;
};

type FeatureTheme = {
  backgroundColor: string;
  textColor: string;
  textSecondary: string;
  primaryColor: string;
  fontFamily: string;
};

const FeatureIconGraphic = ({ name, color }: { name: FeatureIcon; color: string }) => {
  const common = { fill: "none", stroke: color, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 48 48" width="52" height="52" aria-hidden="true">
      {name === "search" && <><circle cx="21" cy="21" r="11" {...common} /><path d="m29 29 10 10" {...common} /></>}
      {name === "document" && <><path d="M13 7h17l7 7v27H13z" {...common} /><path d="M30 7v8h7M19 23h12M19 30h12M19 37h8" {...common} /><path d="m9 37 9-9" {...common} /></>}
      {name === "wrench" && <path d="M39 12a10 10 0 0 1-13 12L12 38l-5-5 14-14A10 10 0 0 1 34 6l-6 6 5 5z" {...common} />}
      {name === "chart" && <><path d="M9 39V10M9 39h31" {...common} /><path d="m14 32 8-9 7 5 10-14" {...common} /></>}
      {name === "people" && <><circle cx="18" cy="17" r="6" {...common} /><circle cx="33" cy="19" r="5" {...common} /><path d="M7 39c1-8 5-12 11-12s10 4 11 12M27 29c7-2 12 2 14 9" {...common} /></>}
      {name === "idea" && <><path d="M16 28c-3-3-5-6-5-11a13 13 0 0 1 26 0c0 5-2 8-5 11-2 2-3 4-3 6H19c0-2-1-4-3-6zM20 40h8" {...common} /></>}
    </svg>
  );
};

export const FeatureCards = ({ data, theme }: {
  data: FeatureCardsData;
  animation?: Record<string, unknown>;
  theme: FeatureTheme;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 24, stiffness: 85 } });
  const items = (data.items || []).slice(0, 3);

  return (
    <AbsoluteFill style={{ padding: "62px 72px 68px", boxSizing: "border-box", overflow: "hidden", backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
      <div style={{ position: "absolute", width: 560, height: 560, right: -230, top: -280, borderRadius: "50%", border: `90px solid ${theme.primaryColor}16` }} />
      <div style={{ opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [24, 0])}px)` }}>
        <div style={{ width: 58, height: 6, backgroundColor: theme.primaryColor, marginBottom: 20 }} />
        <div style={{ fontSize: 57, lineHeight: 1.08, fontWeight: 760, letterSpacing: -1.5 }}>{data.title || "Beyond technical expertise."}</div>
        {data.subtitle && <div style={{ marginTop: 13, color: theme.textSecondary, fontSize: 22 }}>{data.subtitle}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 54, flex: 1 }}>
        {items.map((item, index) => {
          const cardIn = spring({ frame: frame - 14 - index * 9, fps, config: { damping: 20, stiffness: 105 } });
          return (
            <div key={`${item.text}-${index}`} style={{ minHeight: 300, padding: "34px 31px", boxSizing: "border-box", borderRadius: 16, border: `1px solid ${theme.primaryColor}42`, borderTop: `7px solid ${theme.primaryColor}`, backgroundColor: `${theme.primaryColor}0d`, boxShadow: "0 18px 48px rgba(0,0,0,.14)", opacity: cardIn, transform: `translateY(${interpolate(cardIn, [0, 1], [46, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.96, 1])})` }}>
              <div style={{ width: 82, height: 82, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${theme.primaryColor}18` }}>
                <FeatureIconGraphic name={item.icon || "idea"} color={theme.primaryColor} />
              </div>
              <div style={{ marginTop: 29, fontSize: 27, lineHeight: 1.3, fontWeight: 650 }}>{item.text}</div>
              <div style={{ marginTop: 26, width: 38, height: 4, backgroundColor: theme.primaryColor, opacity: 0.72 }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
