import React from "react"
import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion"

interface DonutItem {
  label: string
  value: number
}

    interface AnimatedDonutChartProps {
    title?: string
    data: any
    theme: any
    animation?: {
        durationInFrames?: number
    }
    }

    export const AnimatedDonutChart: React.FC<AnimatedDonutChartProps> = ({
  title,
  data,
  theme,
  animation,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  /** 🔥 NORMALIZAR DATA DE FORMA SEGURA */
  const normalizeData = (): DonutItem[] => {
    if (!data) return []

    // string JSON
    if (typeof data === "string") {
      try {
        data = JSON.parse(data)
      } catch {
        return []
      }
    }

    // { data: [...] }
    if (Array.isArray(data?.data)) {
      return data.data
    }

    // { labels: [], values: [] }
    if (data?.labels && data?.values) {
      return data.labels.map((label: string, i: number) => ({
        label,
        value: Number(data.values[i]) || 0,
      }))
    }

    // [{label, value}]
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        label: item.label ?? "Item",
        value: Number(item.value) || 0,
      }))
    }

    return []
  }

  const normalized = normalizeData()

  if (!normalized.length) return null

  const total = normalized.reduce((acc, item) => acc + item.value, 0)

  if (total === 0) return null

  const palette = theme?.palette ?? [
    "#FF6B6B",
    "#4ECDC4",
    "#FFE66D",
    "#1A535C",
    "#FF9F1C",
  ]

  const progress = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: animation?.durationInFrames ?? fps * 1.5,
  })

  const radius = 180
  const strokeWidth = 60
  const circumference = 2 * Math.PI * radius

  let cumulativePercent = 0

  return (
    <AbsoluteFill
      style={{
        background: theme?.background ?? "#000",
        color: theme?.text ?? "#fff",
        fontFamily: theme?.font ?? "sans-serif",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {title && (
        <h1 style={{ marginBottom: 40, fontSize: 48 }}>{title}</h1>
      )}

      <svg width={500} height={500}>
        <g transform="translate(250,250) rotate(-90)">
          {normalized.map((item, i) => {
            const percent = item.value / total
            const dash = circumference * percent
            const offset = circumference * (1 - cumulativePercent)

            cumulativePercent += percent

            return (
              <circle
                key={i}
                r={radius}
                cx="0"
                cy="0"
                fill="transparent"
                stroke={palette[i % palette.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={offset * (1 - progress)}
                strokeLinecap="round"
              />
            )
          })}
        </g>
      </svg>

      {/* Legend */}
      <div
        style={{
          marginTop: 30,
          display: "flex",
          gap: 30,
          flexWrap: "wrap",
          justifyContent: "center",
          fontSize: 24,
        }}
      >
        {normalized.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 18,
                height: 18,
                background: palette[i % palette.length],
              }}
            />
            <span>
              {item.label} ({Math.round((item.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}