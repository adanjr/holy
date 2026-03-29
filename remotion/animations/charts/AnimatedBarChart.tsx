import React from "react"
import {
  useCurrentFrame,
  spring,
  interpolate,
  AbsoluteFill,
  useVideoConfig,
} from "remotion"

import { ThemeConfig, AnimationConfig } from "../types"

interface AnimatedBarChartProps {
  title?: string
  data: {
    labels: string[]
    values: number[]
    unit?: string
  }
  meta?: {
    source?: string
  }
  theme: ThemeConfig
  animation: AnimationConfig
}

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  title,
  data,
  meta,
  theme,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const maxValue = Math.max(...data.values)

  const chartWidth = 1000
  const chartHeight = 450

  const marginTop = 60
  const marginLeft = 90
  const marginBottom = 95   // ✅ MÁS ESPACIO
  const marginRight = 20

  const innerWidth = chartWidth - marginLeft - marginRight
  const innerHeight = chartHeight - marginTop - marginBottom

  const barWidth = (innerWidth / data.values.length) * 0.55
  const gap = (innerWidth / data.values.length) * 0.45

  const formatNumber = (num: number) =>
    num.toLocaleString("en-US")

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  })

  const yAxisSteps = 4
  const yAxisValues = Array.from({ length: yAxisSteps + 1 }, (_, i) =>
    Math.round((maxValue / yAxisSteps) * i)
  )

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.backgroundColor,
        fontFamily: theme.fontFamily,
        paddingTop: 50,
        paddingLeft: 100,
        paddingRight: 100,
        paddingBottom: 80,
        color: theme.textColor,
      }}
    >
      {(title || data.unit) && (
        <div
          style={{
            opacity: headerOpacity,
            marginBottom: 30,
            textAlign: "center",
          }}
        >
          {title && (
            <div style={{ fontSize: 44, fontWeight: 600 }}>
              {title}
            </div>
          )}

          {data.unit && (
            <div style={{ fontSize: 18, color: theme.textSecondary }}>
              {data.unit}
            </div>
          )}
        </div>
      )}

      <svg
        width={chartWidth}
        height={chartHeight}
        style={{ margin: "0 auto", display: "block", overflow: "visible" }}
      >
        <g transform={`translate(${marginLeft}, ${marginTop})`}>

          {/* GRID + Y AXIS */}
          {yAxisValues.map((val, i) => {
            const y = innerHeight - (val / maxValue) * innerHeight
            return (
              <g key={i}>
                <line
                  x1={0}
                  y1={y}
                  x2={innerWidth}
                  y2={y}
                  stroke={theme.gridColor}
                  strokeWidth={1}
                  opacity={0.35}
                />
                <text
                  x={-18}
                  y={y + 5}
                  textAnchor="end"
                  fontSize={17}
                  fill={theme.textSecondary}
                >
                  {formatNumber(val)}
                </text>
              </g>
            )
          })}

          {/* EJE X */}
          <line
            x1={0}
            y1={innerHeight + 4}
            x2={innerWidth}
            y2={innerHeight + 4}
            stroke={theme.axisColor}
            strokeWidth={1.5}
          />

          {/* BARS */}
          {data.values.map((value, i) => {
            const delay = i * 5

            const progress = spring({
              frame: frame - delay,
              fps,
              config: { damping: 100 },
            })

            const barHeight = interpolate(
              progress,
              [0, 1],
              [0, (value / maxValue) * innerHeight]
            )

            const x = i * (barWidth + gap)
            const y = innerHeight - barHeight

            const animatedValue = Math.round(
              interpolate(progress, [0, 1], [0, value])
            )

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={theme.primaryColor}
                  rx={4}
                />

                {/* VALUE */}
                <text
                  x={x + barWidth / 2}
                  y={y - 12}
                  textAnchor="middle"
                  fontSize={20}
                  fill={theme.textColor}
                  fontWeight={600}
                >
                  {formatNumber(animatedValue)}
                </text>

                {/* TICK */}
                <line
                  x1={x + barWidth / 2}
                  y1={innerHeight + 4}
                  x2={x + barWidth / 2}
                  y2={innerHeight + 12}
                  stroke={theme.axisColor}
                  strokeWidth={1}
                />

                {/* YEAR LABEL */}
                <text
                  x={x + barWidth / 2}
                  y={innerHeight + 42}
                  textAnchor="middle"
                  fontSize={18}
                  fill={theme.textSecondary}
                  fontWeight={500}
                >
                  {data.labels[i]}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {meta?.source && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 100,
            fontSize: 22,
            color: theme.textSecondary,
          }}
        >
          Source: {meta.source}
        </div>
      )}
    </AbsoluteFill>
  )
}