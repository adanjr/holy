"use client"

import React from "react"
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion"

interface WebTheme {
  backgroundColor?: string
  primaryColor?: string
  fontFamily?: string
}

interface WebScrollerProps {
  mode?: "page" | "article"
  url: string
  showUrl?: boolean
  urlText?: string
  scrollPercent?: number
  screenshotUrl?: string
  screenshotWidth?: number
  screenshotHeight?: number
  animation: {
    durationInFrames: number
  }
  theme?: WebTheme
}

export const WebScroller: React.FC<WebScrollerProps> = ({
  mode = "page",
  url,
  showUrl = false,
  urlText,
  scrollPercent = 58,
  screenshotUrl,
  screenshotWidth = 1280,
  screenshotHeight = 2160,
  animation,
  theme,
}) => {
  const frame = useCurrentFrame()
  const { width, height, fps, durationInFrames: compositionDuration } = useVideoConfig()
  const durationInFrames = animation.durationInFrames || compositionDuration
  const introPause = Math.min(fps * 1.2, durationInFrames * 0.08)
  const firstPauseStart = durationInFrames * 0.3
  const middlePauseStart = durationInFrames * 0.55
  const finalPauseStart = durationInFrames * 0.78

  const progress = mode === "article"
    ? interpolate(
        frame,
        [
          0,
          introPause,
          firstPauseStart,
          firstPauseStart + fps * 0.8,
          middlePauseStart,
          middlePauseStart + fps * 0.8,
          finalPauseStart,
          finalPauseStart + fps * 0.7,
          durationInFrames * 0.96,
          durationInFrames,
        ],
        [0, 0, 0.3, 0.3, 0.57, 0.57, 0.82, 0.82, 1, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : interpolate(
        frame,
        [0, durationInFrames * 0.12, durationInFrames * 0.88, durationInFrames],
        [0, 0, 1, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )

  const safeScrollPercent = Math.min(100, Math.max(20, scrollPercent))
  const contentWidth = width - 64
  const contentHeight = height - 112
  const renderedScreenshotHeight = screenshotHeight * (contentWidth / screenshotWidth)
  const maxScroll = Math.max(0, renderedScreenshotHeight - contentHeight)
  const translateY = maxScroll * (safeScrollPercent / 100) * progress
  const displayUrl = urlText?.trim() || url.replace(/^https?:\/\//, "").replace(/\/$/, "")

  return (
    <AbsoluteFill style={{ backgroundColor: theme?.backgroundColor || "#090b10", padding: 28 }}>
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 18, border: `4px solid ${theme?.primaryColor || "transparent"}`, background: "white", boxShadow: "0 24px 70px rgba(0,0,0,.45)" }}>
        <div style={{ height: 48, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "#eef0f4", borderBottom: "1px solid #d9dce3" }}>
          <span style={{ width: 11, height: 11, borderRadius: 99, background: "#ff5f57" }} />
          <span style={{ width: 11, height: 11, borderRadius: 99, background: "#febc2e" }} />
          <span style={{ width: 11, height: 11, borderRadius: 99, background: "#28c840" }} />
          <div style={{ marginLeft: 14, flex: 1, borderRadius: 8, background: "white", color: "#69707d", fontFamily: "Inter, sans-serif", fontSize: 15, padding: "7px 14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{showUrl ? displayUrl : "Web page"}</div>
        </div>
        <div style={{ height: "calc(100% - 48px)", overflow: "hidden", position: "relative", background: "white" }}>
          {screenshotUrl ? (
            <Img
              src={screenshotUrl}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "auto",
                transform: `translateY(-${translateY}px)`,
                willChange: "transform",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#69707d", fontFamily: "Inter, sans-serif", fontSize: 24 }}>
              Web page capture unavailable
            </div>
          )}
        </div>
      </div>

      {showUrl && <div style={{ position: "absolute", left: 54, bottom: 44, maxWidth: "70%", padding: "12px 20px", borderRadius: 999, background: theme?.primaryColor || "rgba(7,10,16,.9)", border: "1px solid rgba(255,255,255,.18)", color: theme?.backgroundColor || "white", fontFamily: theme?.fontFamily || "Inter, sans-serif", fontSize: 22, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayUrl}</div>}
    </AbsoluteFill>
  )
}
