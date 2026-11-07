import React from "react"
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"
import { ThemeConfig } from "./types"

type Props = {
  data: { src?: string; title?: string; caption?: string; direction?: "left" | "right" }
  animation?: { durationInFrames?: number; intensity?: number }
  theme: ThemeConfig
}

export const CinematicImage: React.FC<Props> = ({ data, animation, theme }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const duration = animation?.durationInFrames || durationInFrames
  const progress = interpolate(frame, [0, Math.max(1, duration - 1)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  const reveal = spring({ frame, fps, config: { damping: 24, stiffness: 82 } })
  const textIn = spring({ frame: frame - 16, fps, config: { damping: 22, stiffness: 95 } })
  const right = data.direction !== "left"
  const pan = interpolate(progress, [0, 1], [right ? -18 : 18, right ? 18 : -18])
  const zoom = interpolate(progress, [0, 1], [1.04, 1.13])
  if (!data.src) return null

  return <AbsoluteFill style={{ overflow: "hidden", backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
    <AbsoluteFill style={{ transform: `scale(1.12) translateX(${-pan * 0.3}px)`, filter: "blur(28px) saturate(.82)", opacity: 0.34 }}><Img src={data.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></AbsoluteFill>
    <AbsoluteFill style={{ background: `linear-gradient(120deg, ${theme.backgroundColor}f4 0%, ${theme.backgroundColor}b8 34%, ${theme.backgroundColor}26 100%)` }} />
    <div style={{ position: "absolute", top: 54, left: 64, display: "flex", alignItems: "center", gap: 12, opacity: reveal }}><span style={{ width: 42, height: 5, borderRadius: 99, background: theme.primaryColor }} /><span style={{ color: theme.primaryColor, fontSize: 17, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase" }}>Visual story</span></div>
    <div style={{ position: "absolute", left: right ? 290 : 74, right: right ? 74 : 290, top: 78, bottom: 76, borderRadius: 30, overflow: "hidden", boxShadow: "0 35px 90px rgba(0,0,0,.32)", clipPath: `inset(0 ${interpolate(reveal, [0, 1], [100, 0])}% 0 0 round 30px)`, transform: `perspective(1400px) rotateY(${interpolate(reveal, [0, 1], [right ? -3.5 : 3.5, 0])}deg) translateY(${interpolate(reveal, [0, 1], [36, 0])}px)` }}>
      <Img src={data.src} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) translateX(${pan}px)` }} /><div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.64), transparent 56%)" }} /><div style={{ position: "absolute", inset: 18, border: "1px solid rgba(255,255,255,.32)", borderRadius: 20 }} />
    </div>
    {(data.title || data.caption) && <div style={{ position: "absolute", left: right ? 76 : 720, bottom: 88, width: 480, padding: "22px 26px", borderRadius: 22, background: `${theme.backgroundColor}e8`, border: `1px solid ${theme.textColor}18`, boxShadow: "0 22px 60px rgba(0,0,0,.2)", opacity: textIn, transform: `translateY(${interpolate(textIn, [0, 1], [28, 0])}px)` }}>
      {data.title && <div style={{ fontSize: 39, lineHeight: 1.04, fontWeight: 800, letterSpacing: -1.2 }}>{data.title}</div>}{data.caption && <div style={{ marginTop: data.title ? 11 : 0, color: theme.textSecondary, fontSize: 20, lineHeight: 1.35 }}>{data.caption}</div>}
    </div>}
    <div style={{ position: "absolute", right: 62, bottom: 34, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: theme.textSecondary }}>{String(Math.round(progress * 100)).padStart(2, "0")} / 100</div>
  </AbsoluteFill>
}
