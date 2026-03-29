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

interface LogoItem {
  url: string
  name: string
  label?: string
}

interface LogoGridProps {
  title?: string
  data: {
    images: LogoItem[]
  }
  theme: ThemeConfig
  animation: AnimationConfig
}

export const LogoGridWithNames: React.FC<LogoGridProps> = ({
  title,
  data,
  theme
}) => {

  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const logos = (data?.images || []).slice(0, 10)
  const count = logos.length

  /* ----------------------------- */
  /* Layout Logic */
  /* ----------------------------- */

  let columns = count
  let rows = 1
  let logoSize = 200

  if (count === 1) {
    columns = 1
    logoSize = 320
  }

  if (count === 2) {
    columns = 2
    logoSize = 260
  }

  if (count === 3) {
    columns = 3
    logoSize = 220
  }

  if (count === 4) {
    columns = 2
    rows = 2
    logoSize = 200
  }

  if (count === 5) {
    columns = 5
    logoSize = 170
  }

  if (count >= 6) {
    rows = 2
    columns = Math.ceil(count / 2)
    logoSize = 150
  }

  const gap = count <= 3 ? 90 : 60

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
        paddingLeft: 120,
        paddingRight: 120,
        paddingTop: 60,
        paddingBottom: 80
      }}
    >

      {/* Vignette */}

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
            fontSize: 46,
            fontWeight: 600,
            marginBottom: 70,
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            textAlign: "center",
            letterSpacing: 0.4
          }}
        >
          {title}
        </div>
      )}

      {/* GRID */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, ${logoSize}px)`,
          gridTemplateRows: `repeat(${rows}, auto)`,
          justifyContent: "center",
          alignContent: "center",
          gap
        }}
      >

        {logos.map((item: LogoItem, i: number) => {

          const delay = i * 4

          const progress = spring({
            frame: frame - delay,
            fps,
            config: {
              damping: 120,
              stiffness: 100
            }
          })

          const scale = interpolate(progress, [0, 1], [0.6, 1])
          const opacity = interpolate(progress, [0, 0.6, 1], [0, 0.5, 1])
          const blur = interpolate(progress, [0, 1], [12, 0])

          const label = item.label ?? item.name

          return (
            <div
              key={i}
              style={{
                width: logoSize,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: `scale(${scale})`,
                opacity,
                filter: `blur(${blur}px)`
              }}
            >

              <div
                style={{
                  width: logoSize,
                  height: logoSize,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >

                <Img
                  src={item.url}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    filter: `
                      drop-shadow(0px 8px 18px rgba(0,0,0,0.45))
                      drop-shadow(0px 2px 4px rgba(0,0,0,0.25))
                    `
                  }}
                />

              </div>

              {/* LABEL */}

              <div
                style={{
                  marginTop: 12,
                  fontSize: 22,
                  fontWeight: 500,
                  textAlign: "center",
                  lineHeight: 1.2,
                  maxWidth: logoSize
                }}
              >
                {label}
              </div>

            </div>
          )
        })}

      </div>

    </AbsoluteFill>
  )
}