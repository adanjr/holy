import type { CSSProperties } from "react";

export type BroadcastOverlayData = {
  text?: string | null;
  subtext?: string | null;
  stylePreset?: string | null;
  color?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  fontFamily?: string | null;
  fontSize?: number | null;
  fontWeight?: number | null;
  letterSpacing?: number | null;
  textAlign?: string | null;
  styleOptions?: Record<string, unknown> | null;
};

type Props = { overlay: BroadcastOverlayData; preview?: boolean };

export function getBroadcastOverlayAnchor(position?: string | null) {
  const horizontal = position?.includes("left")
    ? 0
    : position?.includes("right")
      ? -100
      : -50;
  const vertical = position?.includes("top")
    ? 0
    : position?.includes("bottom")
      ? -100
      : -50;
  return {
    horizontal,
    vertical,
    transform: `translate(${horizontal}%, ${vertical}%)`,
    transformOrigin: `${horizontal === 0 ? "left" : horizontal === -100 ? "right" : "center"} ${vertical === 0 ? "top" : vertical === -100 ? "bottom" : "center"}`,
  };
}

export function getBroadcastOverlayPosition(
  position?: string | null,
  positionX?: number | null,
  positionY?: number | null,
) {
  const left = position?.includes("left")
    ? 0.07
    : position?.includes("right")
      ? 0.93
      : (positionX ?? 0.5);
  return { left, top: positionY ?? 0.5 };
}

export const broadcastPresets = [
  { value: "classic", label: "Classic", description: "Clean boxed caption" },
  {
    value: "location",
    label: "Location",
    description: "City or place with accent rule",
  },
  {
    value: "person",
    label: "Person",
    description: "Name and role lower third",
  },
  {
    value: "music",
    label: "Music",
    description: "Song, artist, label and year",
  },
  { value: "minimal", label: "Minimal", description: "Clean text without a box" },
  { value: "cinematic", label: "Cinematic", description: "Large editorial title" },
  { value: "quote", label: "Quote", description: "Quotation with attribution" },
  { value: "statistic", label: "Statistic", description: "Prominent number or metric" },
  { value: "chapter", label: "Chapter", description: "Full-frame chapter heading" },
  { value: "breaking", label: "Breaking news", description: "Urgent broadcast banner" },
  { value: "social", label: "Social", description: "Bold vertical-video card" },
  { value: "callout", label: "Callout", description: "Accent label and pointer" },
  { value: "credits", label: "Credits", description: "Name, role and organization" },
  { value: "countdown", label: "Countdown", description: "Centered countdown card" },
] as const;

export function BroadcastTextOverlay({ overlay, preview = false }: Props) {
  const preset = overlay.stylePreset || "classic";
  const accent = overlay.accentColor || "#f2c94c";
  const align =
    overlay.textAlign === "center" || overlay.textAlign === "right"
      ? overlay.textAlign
      : "left";
  const fontSize = Math.max(12, overlay.fontSize || 36) * (preview ? 0.55 : 1);
  const fontFamily = overlay.fontFamily || "Arial, Helvetica, sans-serif";
  const textStyle: CSSProperties = {
    color: overlay.color || "#fff",
    fontFamily,
    fontSize,
    fontWeight: overlay.fontWeight || 700,
    letterSpacing: overlay.letterSpacing ?? 0,
    lineHeight: 1.05,
    textAlign: align,
    whiteSpace: "pre-wrap",
    textShadow: "0 2px 8px rgba(0,0,0,.55)",
  };
  const subtextStyle: CSSProperties = {
    color: overlay.color || "#fff",
    fontFamily,
    fontSize: fontSize * 0.5,
    fontWeight: 500,
    letterSpacing: Math.max(0.5, overlay.letterSpacing ?? 0),
    lineHeight: 1.25,
    opacity: 0.92,
    textAlign: align,
    whiteSpace: "pre-wrap",
  };
  const background = overlay.backgroundColor || "rgba(8,15,28,.82)";
  const options = overlay.styleOptions || {};
  const numberOption = (key: string, fallback: number) => typeof options[key] === "number" ? options[key] as number : fallback;
  const stringOption = (key: string, fallback: string) => typeof options[key] === "string" ? options[key] as string : fallback;
  const paddingX = numberOption("paddingX", fontSize * 0.48);
  const paddingY = numberOption("paddingY", fontSize * 0.28);
  const radius = numberOption("borderRadius", fontSize * 0.15);
  const maxWidth = numberOption("maxWidth", preview ? 360 : 760);
  const opacity = numberOption("opacity", 1);
  const borderWidth = numberOption("borderWidth", 0);
  const shadowBlur = numberOption("shadowBlur", 24);
  const shadowColor = stringOption("shadowColor", "rgba(0,0,0,.35)");
  const outlineWidth = numberOption("outlineWidth", 0);
  const outlineColor = stringOption("outlineColor", "#000000");
  const lineHeight = numberOption("lineHeight", 1.05);
  const textTransform = stringOption("textTransform", "none") as CSSProperties["textTransform"];
  Object.assign(textStyle, { lineHeight, textTransform, WebkitTextStroke: outlineWidth ? `${outlineWidth}px ${outlineColor}` : undefined, textShadow: `0 3px ${shadowBlur}px ${shadowColor}` });

  if (preset === "location")
    return (
      <div
        style={{
          minWidth: preview ? 180 : 320,
          padding: `${fontSize * 0.38}px ${fontSize * 0.5}px`,
          background,
          borderLeft: `${Math.max(4, fontSize * 0.12)}px solid ${accent}`,
          boxShadow: "0 8px 24px rgba(0,0,0,.28)",
        }}
      >
        <div style={{ ...textStyle, textTransform: "uppercase" }}>
          {overlay.text || "CITY, COUNTRY"}
        </div>
        <div
          style={{
            height: Math.max(2, fontSize * 0.06),
            width: "42%",
            marginTop: fontSize * 0.2,
            background: accent,
          }}
        />
        {overlay.subtext && (
          <div style={{ ...subtextStyle, marginTop: fontSize * 0.18 }}>
            {overlay.subtext}
          </div>
        )}
      </div>
    );

  if (preset === "person")
    return (
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          background,
          boxShadow: "0 8px 24px rgba(0,0,0,.28)",
        }}
      >
        <div
          style={{ width: Math.max(7, fontSize * 0.16), background: accent }}
        />
        <div style={{ padding: `${fontSize * 0.32}px ${fontSize * 0.55}px` }}>
          <div style={textStyle}>{overlay.text || "PERSON NAME"}</div>
          {overlay.subtext && (
            <div
              style={{
                ...subtextStyle,
                marginTop: fontSize * 0.12,
                color: accent,
                textTransform: "uppercase",
              }}
            >
              {overlay.subtext}
            </div>
          )}
        </div>
      </div>
    );

  if (preset === "music")
    return (
      <div
        style={{
          maxWidth: preview ? 280 : 620,
          padding: `${fontSize * 0.32}px ${fontSize * 0.5}px`,
          background:
            "linear-gradient(90deg, rgba(3,7,18,.9), rgba(3,7,18,.45))",
          borderBottom: `${Math.max(3, fontSize * 0.08)}px solid ${accent}`,
        }}
      >
        <div style={{ ...textStyle, fontStyle: "italic" }}>
          {overlay.text || "Song title"}
        </div>
        {overlay.subtext && (
          <div style={{ ...subtextStyle, marginTop: fontSize * 0.14 }}>
            {overlay.subtext}
          </div>
        )}
      </div>
    );

  if (["minimal", "cinematic", "quote", "statistic", "chapter", "breaking", "social", "callout", "credits", "countdown"].includes(preset)) {
    const isCentered = ["cinematic", "statistic", "chapter", "countdown"].includes(preset);
    const label = preset === "quote" ? `“${overlay.text || "A memorable quote"}”` : overlay.text || (preset === "statistic" ? "87%" : "Screen title");
    return (
      <div style={{ maxWidth, padding: `${paddingY}px ${paddingX}px`, opacity, textAlign: isCentered ? "center" : align, background: preset === "minimal" || preset === "cinematic" ? "transparent" : preset === "breaking" ? `linear-gradient(90deg, ${accent}, ${background})` : background, borderRadius: radius, border: borderWidth ? `${borderWidth}px solid ${accent}` : undefined, borderLeft: preset === "callout" ? `${Math.max(5, fontSize * .14)}px solid ${accent}` : undefined, boxShadow: shadowBlur ? `0 8px ${shadowBlur}px ${shadowColor}` : undefined }}>
        {preset === "chapter" && <div style={{ ...subtextStyle, color: accent, textTransform: "uppercase", marginBottom: fontSize * .18 }}>Chapter</div>}
        <div style={{ ...textStyle, textAlign: isCentered ? "center" : align, fontSize: preset === "statistic" || preset === "countdown" ? fontSize * 1.8 : fontSize, fontStyle: preset === "quote" ? "italic" : undefined }}>{label}</div>
        {overlay.subtext && <div style={{ ...subtextStyle, textAlign: isCentered ? "center" : align, marginTop: fontSize * .16, color: preset === "credits" ? accent : subtextStyle.color }}>{overlay.subtext}</div>}
        {(preset === "cinematic" || preset === "chapter") && <div style={{ width: "35%", height: Math.max(2, fontSize * .06), background: accent, margin: `${fontSize * .22}px auto 0` }} />}
      </div>
    );
  }
  return (
    <div
      style={{
        padding: `${fontSize * 0.28}px ${fontSize * 0.48}px`,
        background,
        borderRadius: fontSize * 0.15,
        boxShadow: "0 8px 24px rgba(0,0,0,.28)",
      }}
    >
      <div style={textStyle}>{overlay.text || "Overlay text"}</div>
      {overlay.subtext && (
        <div style={{ ...subtextStyle, marginTop: fontSize * 0.12 }}>
          {overlay.subtext}
        </div>
      )}
    </div>
  );
}
