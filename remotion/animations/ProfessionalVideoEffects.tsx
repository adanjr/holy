import React from "react"
import { AbsoluteFill, Video, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"
import { ThemeConfig } from "./types"

export type ProfessionalVideoPreset = "cinematic-push" | "film-burn" | "glitch" | "spotlight" | "parallax-frame" | "split-reveal"
type Data = { src?: string; preset?: ProfessionalVideoPreset; title?: string; caption?: string }

export const ProfessionalVideoEffects = ({ data, theme }: { data: Data; animation?: Record<string, unknown>; theme: ThemeConfig }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const preset = data.preset || "cinematic-push"
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 84 } })
  const textIn = spring({ frame: frame - 18, fps, config: { damping: 20, stiffness: 92 } })
  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], { extrapolateRight: "clamp" })
  const glitch = preset === "glitch" && (frame % 37 < 4 || frame % 53 < 3)
  const burn = preset === "film-burn" ? interpolate(frame % 75, [0, 10, 24, 75], [0, .78, .12, 0], { extrapolateRight: "clamp" }) : 0
  if (!data.src) return null

  const videoStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${preset === "cinematic-push" ? interpolate(progress, [0, 1], [1.02, 1.14]) : interpolate(enter, [0, 1], [1.08, 1])}) translateX(${glitch ? (frame % 2 ? 11 : -9) : 0}px)`, filter: preset === "film-burn" ? "contrast(1.08) saturate(.82) sepia(.12)" : preset === "spotlight" ? "saturate(.72) contrast(1.12)" : glitch ? "contrast(1.3) saturate(1.8)" : "saturate(1.04) contrast(1.03)" }

  return <AbsoluteFill style={{ overflow: "hidden", background: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
    {preset === "parallax-frame" ? <><AbsoluteFill style={{ opacity: .3, filter: "blur(30px)", transform: `scale(1.18) translateX(${interpolate(progress, [0, 1], [-16, 16])}px)` }}><Video src={data.src} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /></AbsoluteFill><div style={{ position: "absolute", inset: "64px 110px", borderRadius: 28, overflow: "hidden", boxShadow: "0 34px 90px rgba(0,0,0,.42)", transform: `perspective(1200px) rotateY(${interpolate(enter, [0, 1], [-5, 0])}deg) translateY(${interpolate(enter, [0, 1], [40, 0])}px)` }}><Video src={data.src} style={videoStyle} /><div style={{ position: "absolute", inset: 16, border: "1px solid rgba(255,255,255,.28)", borderRadius: 18 }} /></div></> : preset === "split-reveal" ? <><div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${50 - 50 * enter}% 0 0)` }}><Video src={data.src} style={videoStyle} /></div><div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${50 - 50 * enter}%)`, filter: "saturate(.35) contrast(1.15)" }}><Video src={data.src} muted style={videoStyle} /></div></> : <Video src={data.src} style={videoStyle} />}
    {preset === "spotlight" && <><div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 45%, transparent 16%, rgba(0,0,0,.78) 72%)" }} /><div style={{ position: "absolute", left: "50%", top: "45%", width: 430, height: 430, borderRadius: "50%", transform: "translate(-50%,-50%)", border: `2px solid ${theme.primaryColor}77`, boxShadow: `0 0 65px ${theme.primaryColor}44` }} /></>}
    {preset === "film-burn" && <><div style={{ position: "absolute", inset: 0, opacity: burn, mixBlendMode: "screen", background: "linear-gradient(110deg, #ff2f00, #ffbb31 36%, transparent 68%)" }} /><div style={{ position: "absolute", inset: 0, opacity: .16, background: "repeating-linear-gradient(90deg, transparent 0 3px, rgba(255,255,255,.3) 3px 4px)" }} /></>}
    {preset === "glitch" && <><div style={{ position: "absolute", inset: 0, opacity: glitch ? .46 : 0, background: "repeating-linear-gradient(0deg, transparent 0 8px, rgba(0,255,255,.28) 8px 11px, rgba(255,0,90,.24) 11px 14px)", transform: `translateX(${frame % 2 ? 14 : -14}px)` }} /><div style={{ position: "absolute", left: 0, right: 0, top: `${(frame * 17) % 100}%`, height: glitch ? 16 : 2, background: theme.primaryColor, opacity: .7 }} /></>}
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.72), transparent 52%)" }} />
    {(data.title || data.caption) && <div style={{ position: "absolute", left: 74, right: 74, bottom: 65, opacity: textIn, transform: `translateY(${interpolate(textIn, [0, 1], [28, 0])}px)` }}><div style={{ width: 46, height: 5, borderRadius: 99, background: theme.primaryColor, marginBottom: 16 }} />{data.title && <div style={{ maxWidth: 900, fontSize: 51, lineHeight: 1.04, fontWeight: 820, letterSpacing: -1.7 }}>{data.title}</div>}{data.caption && <div style={{ marginTop: 12, maxWidth: 760, fontSize: 22, lineHeight: 1.35, color: "rgba(255,255,255,.82)" }}>{data.caption}</div>}</div>}
  </AbsoluteFill>
}
