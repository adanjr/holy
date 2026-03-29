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

interface MultiPanelProps {
  title?: string
  data: {
    items: {
      src: string
      isVideo?: boolean
    }[]
    layout: "stacked-vertical" | "stacked-horizontal"
  }
  theme: ThemeConfig
  animation: AnimationConfig
}

export const MultiPanel: React.FC<MultiPanelProps> = ({
  title,
  data,
  theme
}) => {

  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const items = data.items || []

  /* ----------------------------- */
  /* Animación */
  /* ----------------------------- */

  const progress = spring({
    frame,
    fps,
    config: { damping: 120, stiffness: 100 }
  })

  const opacity = interpolate(progress, [0, 1], [0, 1])

  /* ----------------------------- */
  /* Layout */
  /* ----------------------------- */

  const isVertical = data.layout === "stacked-vertical"

  const containerStyle = isVertical
    ? {
        display: "grid",
        gridTemplateRows: "1fr 1fr 1fr"
      }
    : {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr"
      }

  /* ----------------------------- */
  /* Render */
  /* ----------------------------- */

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>

      {/* Panels */}
      <div style={{ ...containerStyle, width: "100%", height: "100%" }}>
        {items.map((item, i) => {

          const delay = i * 5

          const itemOpacity = interpolate(
            frame - delay,
            [0, 20],
            [0, 1],
            { extrapolateRight: "clamp" }
          )

          return (
            <div key={i} style={{ position: "relative", overflow: "hidden" }}>

              {item.isVideo ? (
                <Video
                  src={item.src}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: itemOpacity
                  }}
                />
              ) : (
                <Img
                  src={item.src}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: itemOpacity
                  }}
                />
              )}

            </div>
          )
        })}
      </div>

      {/* Overlay gradiente */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)"
        }}
      />

      {/* Texto superior */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            right: 80,
            textAlign: "center",
            color: "#fff",
            fontSize: 48,
            fontWeight: 700,
            fontFamily: theme.fontFamily,
            opacity
          }}
        >
          {title}
        </div>
      )}

    </AbsoluteFill>
  )
}