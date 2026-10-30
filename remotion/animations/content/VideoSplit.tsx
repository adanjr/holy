import React from "react"
import {
  AbsoluteFill,
  Video,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"
import { AnimationConfig, ThemeConfig } from "../types"

type VideoSplitProps = {
  data: {
    title?: string
    left: { src: string; label?: string }
    right: { src: string; label?: string }
  }
  theme: ThemeConfig
  animation: AnimationConfig
}

export const VideoSplit: React.FC<VideoSplitProps> = ({ data, theme }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const entrance = spring({ frame, fps, config: { damping: 22, stiffness: 95 } })
  const titleOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const panels = [
    { ...data.left, side: "left" },
    { ...data.right, side: "right" },
  ]

  return (
    <AbsoluteFill style={{ backgroundColor: theme.backgroundColor || "#080b12", padding: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, height: "100%" }}>
        {panels.map((panel, index) => (
          <div
            key={panel.side}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 18,
              backgroundColor: "#000",
              border: `2px solid ${theme.primaryColor || "#6d5dfc"}55`,
              opacity: entrance,
              transform: `translateX(${interpolate(entrance, [0, 1], [index === 0 ? -70 : 70, 0])}px)`,
            }}
          >
            <Video
              src={panel.src}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {panel.label && (
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  bottom: 20,
                  maxWidth: "80%",
                  borderRadius: 999,
                  padding: "9px 16px",
                  color: "#fff",
                  backgroundColor: "rgba(0,0,0,.68)",
                  fontFamily: theme.fontFamily,
                  fontSize: 20,
                  fontWeight: 700,
                  backdropFilter: "blur(8px)",
                }}
              >
                {panel.label}
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: 42,
          bottom: 42,
          left: "50%",
          width: 3,
          borderRadius: 99,
          backgroundColor: theme.primaryColor || "#6d5dfc",
          transform: "translateX(-50%)",
          opacity: entrance,
        }}
      />
      {data.title && (
        <div
          style={{
            position: "absolute",
            top: 52,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "78%",
            borderRadius: 12,
            padding: "12px 24px",
            color: theme.textColor || "#fff",
            backgroundColor: `${theme.backgroundColor || "#080b12"}E6`,
            fontFamily: theme.fontFamily,
            fontSize: 34,
            fontWeight: 800,
            textAlign: "center",
            opacity: titleOpacity,
          }}
        >
          {data.title}
        </div>
      )}
    </AbsoluteFill>
  )
}
