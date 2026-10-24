import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type CourseIntroData = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  backgroundImage?: string | null;
  logos?: string[];
  logoPosition?: "top" | "bottom";
  alignment?: "left" | "center";
};

type CourseTheme = {
  backgroundColor: string;
  textColor: string;
  textSecondary: string;
  primaryColor: string;
  fontFamily: string;
};

export const CourseIntro = ({ data, theme }: {
  data: CourseIntroData;
  animation?: Record<string, unknown>;
  theme: CourseTheme;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame: frame - 8, fps, config: { damping: 22, stiffness: 85 } });
  const detailIn = spring({ frame: frame - 20, fps, config: { damping: 24, stiffness: 90 } });
  const logos = (data.logos || []).slice(0, 2);
  const centered = data.alignment === "center";
  const logoPosition = data.logoPosition === "bottom" ? "bottom" : "top";

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
      {data.backgroundImage ? (
        <Img src={data.backgroundImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <AbsoluteFill>
          <div style={{ position: "absolute", width: 760, height: 760, right: -210, top: -330, borderRadius: "50%", border: `110px solid ${theme.primaryColor}1f` }} />
          <div style={{ position: "absolute", left: -120, bottom: -230, width: 650, height: 430, transform: "rotate(-12deg)", background: `linear-gradient(135deg, ${theme.primaryColor}30, transparent)` }} />
          <AbsoluteFill style={{ background: `linear-gradient(120deg, ${theme.primaryColor}16, transparent 45%, ${theme.primaryColor}0d)` }} />
        </AbsoluteFill>
      )}

      {data.backgroundImage && <AbsoluteFill style={{ background: `linear-gradient(90deg, ${theme.backgroundColor}f2 0%, ${theme.backgroundColor}d9 48%, ${theme.backgroundColor}70 100%)` }} />}

      <div style={{ position: "absolute", left: 72, right: 72, [logoPosition]: 48, display: "flex", justifyContent: logos.length > 1 ? "space-between" : centered ? "center" : "flex-end", alignItems: "center", opacity: detailIn }}>
        {logos.map((logo, index) => (
          <div key={`${logo}-${index}`} style={{ width: 190, height: 64, padding: "10px 16px", boxSizing: "border-box", borderRadius: 10, backgroundColor: "rgba(255,255,255,.94)", boxShadow: "0 8px 26px rgba(0,0,0,.16)" }}>
            <Img src={logo} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: centered ? 150 : 92, right: centered ? 150 : 250, top: "50%", textAlign: centered ? "center" : "left", transform: `translateY(calc(-50% + ${interpolate(titleIn, [0, 1], [38, 0])}px))`, opacity: titleIn }}>
        <div style={{ color: theme.primaryColor, fontSize: 18, fontWeight: 800, letterSpacing: 4.2 }}>{(data.eyebrow || "COURSE INTRO").toUpperCase()}</div>
        <div style={{ width: centered ? 84 : 64, height: 6, margin: centered ? "22px auto 26px" : "22px 0 26px", backgroundColor: theme.primaryColor }} />
        <div style={{ fontSize: 70, lineHeight: 1.04, fontWeight: 750, letterSpacing: -2.2 }}>{data.title || "Course title"}</div>
        {data.subtitle && <div style={{ marginTop: 24, maxWidth: centered ? 900 : 790, marginLeft: centered ? "auto" : 0, marginRight: centered ? "auto" : 0, color: theme.textSecondary, fontSize: 27, lineHeight: 1.35, opacity: detailIn }}>{data.subtitle}</div>}
      </div>
    </AbsoluteFill>
  );
};
