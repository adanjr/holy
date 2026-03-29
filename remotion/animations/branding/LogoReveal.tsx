import React from "react"
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring
} from "remotion"

import { ThemeConfig, AnimationConfig } from "../../types"

interface LogoRevealProps {
  data: {
    image: string
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
    frame,
    fps,
    config: {
      damping: 120,
      stiffness: 90
    }
  })

  const scale = interpolate(progress, [0, 1], [0.6, 1])
  const opacity = interpolate(progress, [0, 1], [0, 1])

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

      {/* Logo */}
      <Img
        src={data.image}
        style={{
          width: 420,
          transform: `scale(${scale})`,
          opacity,
          filter: `
            drop-shadow(0px 10px 30px rgba(0,0,0,0.6))
            drop-shadow(0px 0px ${30 * glow}px rgba(255,255,255,0.25))
          `
        }}
      />

    </AbsoluteFill>
  )
}