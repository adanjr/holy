import React from "react"
import {
  AbsoluteFill,
  Img,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring
} from "remotion"

import { ThemeConfig, AnimationConfig } from "../types"

interface MediaOverlayProps {
  data: {
    src: string
    headline?: string
    subheadline?: string
    isVideo?: boolean
  }
  theme: ThemeConfig
  animation: AnimationConfig
}

export const MediaOverlay: React.FC<MediaOverlayProps> = ({
  data,
  theme
}) => {

  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  /* ----------------------------- */
  /* Entrada */
  /* ----------------------------- */

  const progress = spring({
    frame,
    fps,
    config: {
      damping: 120,
      stiffness: 100
    }
  })

  const scale = interpolate(progress, [0, 1], [1.1, 1])
  const opacity = interpolate(progress, [0, 1], [0, 1])

  /* ----------------------------- */
  /* Texto animación */
  /* ----------------------------- */

  const textOpacity = interpolate(frame, [15, 40], [0, 1])

  const textY = interpolate(frame, [15, 40], [30, 0])

  /* ----------------------------- */
  /* Render */
  /* ----------------------------- */

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
      }}
    >

      {/* Media fondo */}
      {data.isVideo ? (
        <Video
          src={data.src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
            opacity
          }}
        />
      ) : (
        <Img
          src={data.src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
            opacity
          }}
        />
      )}

      {/* Overlay oscuro */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75), transparent 60%)"
        }}
      />

      {/* Texto */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 80,
          right: 80,
          color: "#fff",
          fontFamily: theme.fontFamily,
          transform: `translateY(${textY}px)`,
          opacity: textOpacity
        }}
      >

        {data.headline && (
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              marginBottom: 20
            }}
          >
            {data.headline}
          </div>
        )}

        {data.subheadline && (
          <div
            style={{
              fontSize: 26,
              opacity: 0.9,
              lineHeight: 1.5,
              maxWidth: 700
            }}
          >
            {data.subheadline}
          </div>
        )}

      </div>

    </AbsoluteFill>
  )
}