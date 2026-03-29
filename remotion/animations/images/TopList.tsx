import React from "react"
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate
} from "remotion"

import { ThemeConfig, AnimationConfig } from "../types"

interface TopListProps {
  title?: string
  data: {
    items: {
      name: string
      image?: string
    }[]
  }
  theme: ThemeConfig
  animation: AnimationConfig
}

export const TopList: React.FC<TopListProps> = ({
  title,
  data,
  theme
}) => {

  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const items = (data?.items || []).slice(0, 20)
  const count = items.length

  /* ----------------------------- */
  /* Dynamic sizes based on count */
  /* ----------------------------- */

  let fontSize = 54
  let imageSize = 70
  let gap = 30

  if (count >= 6) {
    fontSize = 46
    imageSize = 60
  }

  if (count >= 10) {
    fontSize = 38
    imageSize = 52
  }

  if (count >= 14) {
    fontSize = 32
    imageSize = 46
  }

  if (count >= 18) {
    fontSize = 28
    imageSize = 40
    gap = 22
  }

  /* ----------------------------- */
  /* Title animation */
  /* ----------------------------- */

  const headerOpacity = interpolate(
    frame,
    [0, 20],
    [0, 1],
    { extrapolateRight: "clamp" }
  )

  const headerY = interpolate(
    frame,
    [0, 20],
    [-30, 0],
    { extrapolateRight: "clamp" }
  )

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.backgroundColor,
        fontFamily: theme.fontFamily,
        color: theme.textColor,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 160,
        paddingRight: 160,
        paddingTop: 80,
        paddingBottom: 80
      }}
    >

      {/* Cinematic vignette */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.35) 100%)",
          pointerEvents: "none"
        }}
      />

      {/* Title */}

      {title && (
        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            marginBottom: 60,
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            textAlign: "center",
            letterSpacing: 0.4
          }}
        >
          {title}
        </div>
      )}

      {/* List */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap
        }}
      >

        {items.map((item, i) => {

          const delay = i * 3

          const progress = spring({
            frame: frame - delay,
            fps,
            config: {
              damping: 120,
              stiffness: 100
            }
          })

          const opacity = interpolate(
            progress,
            [0, 1],
            [0, 1]
          )

          const translateY = interpolate(
            progress,
            [0, 1],
            [40, 0]
          )

          const scale = interpolate(
            progress,
            [0, 1],
            [0.9, 1]
          )

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                fontSize,
                fontWeight: 600,
                opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
                textAlign: "center"
              }}
            >

              {/* Number */}

              <div
                style={{
                  width: 70,
                  textAlign: "right",
                  opacity: 0.7
                }}
              >
                {i + 1}.
              </div>

              {/* Image */}

              {item.image && (
                <Img
                  src={item.image}
                  style={{
                    width: imageSize,
                    height: imageSize,
                    objectFit: "contain",
                    filter: `
                      drop-shadow(0px 8px 18px rgba(0,0,0,0.45))
                      drop-shadow(0px 2px 4px rgba(0,0,0,0.25))
                    `
                  }}
                />
              )}

              {/* Name */}

              <div
                style={{
                  minWidth: 400,
                  textAlign: "left",
                  letterSpacing: 0.2
                }}
              >
                {item.name}
              </div>

            </div>
          )
        })}

      </div>

    </AbsoluteFill>
  )
}