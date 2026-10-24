import React from "react"
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring
} from "remotion"

import type { ThemeConfig, AnimationConfig } from "../types"

interface LogoRevealProps {
  data: {
    image: string
    mode?: "intro" | "outro"
    tagline?: string
  }
  theme: ThemeConfig
  animation: AnimationConfig
}

export const LogoReveal: React.FC<LogoRevealProps> = ({
  data,
  theme
}) => {

  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  /* ----------------------------- */
  /* Entrada cinematic */
  /* ----------------------------- */

  const progress = spring({
    frame: frame - (data.mode === "outro" ? 8 : 0),
    fps,
    config: {
      damping: 120,
      stiffness: 90
    }
  })

  const scale = interpolate(progress, [0, 1], [0.6, 1])
  const opacity = interpolate(progress, [0, 1], [0, 1])
  const hasTagline = Boolean(data.tagline?.trim())
  const taglineProgress = spring({
    frame: frame - (data.mode === "outro" ? 24 : 18),
    fps,
    config: { damping: 24, stiffness: 85 }
  })

  /* ----------------------------- */
  /* Glow dinámico */
  /* ----------------------------- */

  const glow = interpolate(
    frame,
    [0, 30, 60],
    [0, 1, 0.6],
    { extrapolateRight: "clamp" }
  )

  /* ----------------------------- */
  /* Render */
  /* ----------------------------- */

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.backgroundColor || "#000",
        justifyContent: "center",
        alignItems: "center"
      }}
    >

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.7) 100%)"
        }}
      />

      {/* Logo and tagline use separate layout slots to avoid overlap. */}
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: hasTagline ? 118 : 96,
          bottom: hasTagline ? 260 : 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Img
          src={data.image}
          style={{
            width: hasTagline ? 340 : 400,
            maxWidth: "68%",
            maxHeight: "72%",
            objectFit: "contain",
            transform: `scale(${scale})`,
            opacity,
            filter: `
              drop-shadow(0px 10px 30px rgba(0,0,0,0.6))
              drop-shadow(0px 0px ${30 * glow}px rgba(255,255,255,0.25))
            `
          }}
        />
      </div>

      {hasTagline && (
        <div
          style={{
            position: "absolute",
            left: 180,
            right: 180,
            bottom: 145,
            maxWidth: 760,
            margin: "0 auto",
            color: theme.textColor || "#fff",
            fontFamily: theme.fontFamily || "Inter, Helvetica, Arial, sans-serif",
            fontSize: 26,
            lineHeight: 1.28,
            fontWeight: 650,
            letterSpacing: 0.35,
            textAlign: "center",
            opacity: taglineProgress,
            transform: `translateY(${interpolate(taglineProgress, [0, 1], [16, 0])}px)`
          }}
        >
          <div
            style={{
              width: 54,
              height: 4,
              margin: "0 auto 19px",
              borderRadius: 999,
              backgroundColor: theme.primaryColor || theme.textColor || "#fff",
              boxShadow: `0 0 18px ${theme.primaryColor || "rgba(255,255,255,.3)"}`
            }}
          />
          {data.tagline}
        </div>
      )}

    </AbsoluteFill>
  )
}
