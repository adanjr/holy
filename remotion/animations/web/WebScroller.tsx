"use client"

import React from "react"
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion"

interface WebScrollerProps {
  url: string
  animation: {
    durationInFrames: number
  }
}

export const WebScroller: React.FC<WebScrollerProps> = ({
  url,
  animation,
}) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  const progress = interpolate(
    frame,
    [0, durationInFrames],
    [0, 1],
    { extrapolateRight: "clamp" }
  )

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <div
        style={{
          transform: `translateY(-${progress * 60}%)`, // scroll vertical
          willChange: "transform",
        }}
      >
        <iframe
          src={url}
          style={{
            width: "100%",
            height: "160%",
            border: "none",
          }}
        />
      </div>
    </AbsoluteFill>
  )
}