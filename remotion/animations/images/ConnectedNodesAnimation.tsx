"use client"

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

interface Props {
  title?: string
  data: {
    images: LogoItem[]
  }
  theme: ThemeConfig
  animation: AnimationConfig
}

export const ConnectedNodesAnimation: React.FC<Props> = ({
  title,
  data,
  theme
}) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()

  const items = (data?.images || []).slice(0, 8)
  if (!items.length) return null

  const center = items[0]
  const nodes = items.slice(1)

  const centerX = width / 2
  const centerY = height / 2

  // 🔥 MÁS DISTANCIA ENTRE NODOS
  const radius = Math.min(width, height) * 0.38

  const centerRadius = 130
  const nodeRadius = 70

  /* ---------------- TITLE ---------------- */

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp"
  })

  const headerY = interpolate(frame, [0, 20], [-30, 0], {
    extrapolateRight: "clamp"
  })

  /* ---------------- CENTER ---------------- */

  const centerProgress = spring({
    frame,
    fps,
    config: { damping: 120, stiffness: 100 }
  })

  const baseScale = interpolate(centerProgress, [0, 1], [0.6, 1])
  const centerOpacity = interpolate(centerProgress, [0, 1], [0, 1])

  const pulse = interpolate(Math.sin(frame / 10), [-1, 1], [0.96, 1.04])
  const centerScale = baseScale * pulse

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.backgroundColor,
        fontFamily: theme.fontFamily,
        color: theme.textColor,
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      {/* TITLE */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: 80,
            fontSize: 48,
            fontWeight: 600,
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`
          }}
        >
          {title}
        </div>
      )}

      {/* 🔥 SVG GLOBAL PARA TODAS LAS LÍNEAS */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          zIndex: 0
        }}
      >
        {nodes.map((_, i) => {
          const angle = (i / nodes.length) * Math.PI * 2

          const targetX = centerX + Math.cos(angle) * radius
          const targetY = centerY + Math.sin(angle) * radius

          const dx = targetX - centerX
          const dy = targetY - centerY
          const distance = Math.sqrt(dx * dx + dy * dy)

          const startX = centerX + (dx / distance) * centerRadius
          const startY = centerY + (dy / distance) * centerRadius

          const endX = targetX - (dx / distance) * nodeRadius
          const endY = targetY - (dy / distance) * nodeRadius

          const delay = 15 + i * 5

          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 120, stiffness: 100 }
          })

          const lineProgress = interpolate(progress, [0, 1], [0, 1])

          const lineX = interpolate(lineProgress, [0, 1], [startX, endX])
          const lineY = interpolate(lineProgress, [0, 1], [startY, endY])

          return (
            <g key={i}>
              {/* línea */}
              <line
                x1={startX}
                y1={startY}
                x2={lineX}
                y2={lineY}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="3"
                style={{
                  filter: "drop-shadow(0 0 8px rgba(255,255,255,0.6))"
                }}
              />

              {/* partícula animada */}
              <circle r="3" fill="white">
                <animateMotion
                  dur="1.6s"
                  repeatCount="indefinite"
                  path={`M ${startX} ${startY} L ${endX} ${endY}`}
                />
              </circle>
            </g>
          )
        })}
      </svg>

      {/* CENTER NODE */}
      <div
        style={{
          position: "absolute",
          left: centerX,
          top: centerY,
          transform: `translate(-50%, -50%) scale(${centerScale})`,
          opacity: centerOpacity,
          zIndex: 2
        }}
      >
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
            border: "2px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.6)"
          }}
        >
          <Img
            src={center.url}
            style={{
              width: "70%",
              height: "70%",
              objectFit: "contain"
            }}
          />
        </div>
      </div>

      {/* NODES */}
      {nodes.map((node, i) => {
        const angle = (i / nodes.length) * Math.PI * 2

        const targetX = centerX + Math.cos(angle) * radius
        const targetY = centerY + Math.sin(angle) * radius

        const delay = 15 + i * 5

        const progress = spring({
          frame: frame - delay,
          fps,
          config: { damping: 120, stiffness: 100 }
        })

        const x = interpolate(progress, [0, 1], [centerX, targetX])
        const y = interpolate(progress, [0, 1], [centerY, targetY])

        const scale = interpolate(progress, [0, 1], [0.5, 1])
        const opacity = interpolate(progress, [0, 1], [0, 1])

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 6px 20px rgba(0,0,0,0.4)"
              }}
            >
              <Img
                src={node.url}
                style={{
                  width: "65%",
                  height: "65%",
                  objectFit: "contain"
                }}
              />
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 20,
                textAlign: "center",
                maxWidth: 140
              }}
            >
              {node.label ?? node.name}
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}