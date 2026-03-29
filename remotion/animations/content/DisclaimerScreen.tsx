import React from "react"
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring
} from "remotion"

import { ThemeConfig, AnimationConfig } from "../types"

interface DisclaimerScreenProps {
  title?: string
  data: {
    text?: string
    image?: string
    backgroundColor?: string
  }
  theme: ThemeConfig
  animation: AnimationConfig
}

export const DisclaimerScreen: React.FC<DisclaimerScreenProps> = ({
  title,
  data,
  theme
}) => {

  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  /* ----------------------------- */
  /* Entrada suave */
  /* ----------------------------- */

  const intro = spring({
    frame,
    fps,
    config: {
      damping: 120,
      stiffness: 100
    }
  })

  const opacity = interpolate(intro, [0, 1], [0, 1])
  const scale = interpolate(intro, [0, 1], [0.96, 1])

  /* ----------------------------- */
  /* Tamaño dinámico inteligente */
  /* ----------------------------- */

  const textLength = data?.text?.length || 0

  let fontSize = 26

  if (textLength > 400) fontSize = 24
  if (textLength > 800) fontSize = 22
  if (textLength > 1200) fontSize = 20
  if (textLength > 1600) fontSize = 18

  /* ----------------------------- */
  /* Render */
  /* ----------------------------- */

  return (
    <AbsoluteFill
      style={{
        backgroundColor: data?.backgroundColor || "#000",
        color: "#fff",
        fontFamily: theme.fontFamily,
        justifyContent: "center",
        alignItems: "center",
        padding: 80
      }}
    >

      {/* ----------------------------- */}
      {/* Vignette cinematográfico */}
      {/* ----------------------------- */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.75) 100%)",
          pointerEvents: "none"
        }}
      />

      {/* ----------------------------- */}
      {/* Imagen tipo FBI */}
      {/* ----------------------------- */}

      {data?.image && (
        <Img
          src={data.image}
          style={{
            position: "absolute",
            top: 60,
            width: 220,
            opacity,
            transform: `scale(${scale})`,
            filter: "drop-shadow(0px 10px 25px rgba(0,0,0,0.7))"
          }}
        />
      )}

      {/* ----------------------------- */}
      {/* Contenedor */}
      {/* ----------------------------- */}

      <div
        style={{
          maxWidth: 900,
          maxHeight: 420,
          overflow: "hidden",
          textAlign: "center",
          transform: `scale(${scale})`
        }}
      >

        {/* ----------------------------- */}
        {/* Título */}
        {/* ----------------------------- */}

        {title && (
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              marginBottom: 25,
              letterSpacing: 1,
              opacity
            }}
          >
            {title}
          </div>
        )}

        {/* ----------------------------- */}
        {/* Texto */}
        {/* ----------------------------- */}

        <div
          style={{
            fontSize,
            lineHeight: 1.6,
            opacity,
            whiteSpace: "pre-line"
          }}
        >
          {data?.text}
        </div>

      </div>

      {/* ----------------------------- */}
      {/* Fade inferior (clave visual) */}
      {/* ----------------------------- */}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          height: 140,
          width: "100%",
          background:
            "linear-gradient(to bottom, transparent, rgba(0,0,0,0.9))"
        }}
      />

    </AbsoluteFill>
  )
}