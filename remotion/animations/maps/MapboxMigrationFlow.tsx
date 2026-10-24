"use client"

import type { Feature, MultiPoint } from "geojson"
import { bbox } from "@turf/bbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useMemo, useRef, useState } from "react"
import { AbsoluteFill, interpolate, useCurrentFrame, useDelayRender, useVideoConfig } from "remotion"

type FlowLocation = { name: string; coords: [number, number] }
type MigrationFlow = {
  from: FlowLocation
  to: FlowLocation
  value?: number
  displayValue?: string
  color?: string
}
type Props = {
  data: {
    title?: string
    flows: MigrationFlow[]
    unit?: string
    mapStyle?: "standard" | "satellite" | "outdoors"
  }
  animation?: { durationInFrames?: number }
  theme?: { primaryColor?: string; backgroundColor?: string; fontFamily?: string }
}
type ScreenFlow = MigrationFlow & {
  start: { x: number; y: number }
  control: { x: number; y: number }
  end: { x: number; y: number }
}

const curvePoint = (flow: ScreenFlow, progress: number) => {
  const t = Math.max(0, Math.min(1, progress))
  const inverse = 1 - t
  return {
    x: inverse * inverse * flow.start.x + 2 * inverse * t * flow.control.x + t * t * flow.end.x,
    y: inverse * inverse * flow.start.y + 2 * inverse * t * flow.control.y + t * t * flow.end.y,
  }
}

export const MapboxMigrationFlow = ({ data, animation, theme }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const frame = useCurrentFrame()
  const video = useVideoConfig()
  const { delayRender, continueRender } = useDelayRender()
  const [renderHandle] = useState(() => delayRender("Drawing migration flow map"))
  const [mapImage, setMapImage] = useState<string | null>(null)
  const [screenFlows, setScreenFlows] = useState<ScreenFlow[]>([])
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const flows = data?.flows || []

  const mapBounds = useMemo(() => {
    if (!flows.length) return null
    const coordinates = flows.flatMap((flow) => [flow.from.coords, flow.to.coords])
    const feature: Feature<MultiPoint> = { type: "Feature", properties: {}, geometry: { type: "MultiPoint", coordinates } }
    const [west, south, east, north] = bbox(feature)
    return [[west, south], [east, north]] as [[number, number], [number, number]]
  }, [flows])

  const valueRange = useMemo(() => {
    const values = flows.map((flow) => Number(flow.value) || 1)
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [flows])

  useEffect(() => {
    if (!containerRef.current || !flows.length || !mapBounds || mapRef.current) return
    if (!mapboxToken) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is required for Animated Migration Flow")
    mapboxgl.accessToken = mapboxToken
    const style = data.mapStyle === "satellite"
      ? "mapbox://styles/mapbox/satellite-streets-v12"
      : data.mapStyle === "outdoors"
        ? "mapbox://styles/mapbox/outdoors-v12"
        : "mapbox://styles/mapbox/streets-v12"
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: [(mapBounds[0][0] + mapBounds[1][0]) / 2, (mapBounds[0][1] + mapBounds[1][1]) / 2],
      zoom: 2,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      preserveDrawingBuffer: true,
    })
    mapRef.current = map
    let completed = false
    const complete = () => {
      if (completed) return
      completed = true
      setScreenFlows(flows.map((flow, index) => {
        const start = map.project(flow.from.coords)
        const end = map.project(flow.to.coords)
        const distance = Math.hypot(end.x - start.x, end.y - start.y)
        const direction = index % 2 ? -1 : 1
        return {
          ...flow,
          start: { x: start.x, y: start.y },
          end: { x: end.x, y: end.y },
          control: {
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2 - Math.min(150, Math.max(45, distance * 0.24)) * direction,
          },
        }
      }))
      try { setMapImage(map.getCanvas().toDataURL("image/png")) }
      catch (error) { console.error("Unable to freeze Migration Flow map", error) }
      continueRender(renderHandle)
    }
    map.on("load", () => {
      map.fitBounds(mapBounds, { padding: { top: 105, right: 90, bottom: 105, left: 90 }, animate: false })
      map.once("idle", complete)
    })
    map.on("error", (event) => console.error("Migration Flow Mapbox error", event.error))
    return () => {
      if (!completed) continueRender(renderHandle)
      mapRef.current = null
      map.remove()
    }
  }, [continueRender, data.mapStyle, flows, mapBounds, mapboxToken, renderHandle])

  if (!flows.length || !mapBounds) return null
  const duration = animation?.durationInFrames || video.durationInFrames
  const fontFamily = theme?.fontFamily || "Arial, sans-serif"
  const defaultColor = theme?.primaryColor || "#0ea5e9"

  return (
    <AbsoluteFill style={{ backgroundColor: theme?.backgroundColor || "#e8edf2" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, opacity: mapImage ? 0 : 1 }} />
      {mapImage ? <img src={mapImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      {data.title ? <div style={{ position: "absolute", left: 34, top: 28, padding: "11px 18px", borderRadius: 7, background: "rgba(4,12,24,.82)", color: "#ffffff", fontFamily, fontSize: 27, fontWeight: 850, boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>{data.title}</div> : null}

      <svg viewBox="0 0 1280 720" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        {screenFlows.map((flow, index) => {
          const delay = 10 + index * 9
          const progress = interpolate(frame, [delay, Math.max(delay + 18, duration - 20 + index * 2)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          const valueRatio = valueRange.max === valueRange.min ? 0.55 : ((Number(flow.value) || 1) - valueRange.min) / (valueRange.max - valueRange.min)
          const width = 4 + valueRatio * 10
          const color = flow.color || defaultColor
          const path = `M ${flow.start.x} ${flow.start.y} Q ${flow.control.x} ${flow.control.y} ${flow.end.x} ${flow.end.y}`
          const particle = curvePoint(flow, progress)
          return (
            <g key={`${flow.from.name}-${flow.to.name}-${index}`}>
              <path d={path} pathLength={1} fill="none" stroke="rgba(255,255,255,.88)" strokeWidth={width + 5} strokeLinecap="round" strokeDasharray={1} strokeDashoffset={1 - progress} />
              <path d={path} pathLength={1} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={1} strokeDashoffset={1 - progress} />
              <circle cx={particle.x} cy={particle.y} r={6 + width * 0.35} fill={color} stroke="#ffffff" strokeWidth={3} />
              <circle cx={flow.start.x} cy={flow.start.y} r={7} fill="#ffffff" stroke={color} strokeWidth={4} />
              {progress > 0.96 ? <circle cx={flow.end.x} cy={flow.end.y} r={9} fill={color} stroke="#ffffff" strokeWidth={3} /> : null}
            </g>
          )
        })}
      </svg>

      {screenFlows.map((flow, index) => {
        const delay = 10 + index * 9
        const progress = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        const color = flow.color || defaultColor
        return (
          <div key={`label-${flow.from.name}-${flow.to.name}-${index}`} style={{ position: "absolute", left: flow.end.x, top: flow.end.y - 16, transform: "translate(-50%, -100%)", opacity: progress, padding: "7px 10px", borderRadius: 6, borderLeft: `5px solid ${color}`, background: "rgba(4,12,24,.84)", color: "#ffffff", fontFamily, textAlign: "center", whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(0,0,0,.38)" }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{flow.to.name}</div>
            {flow.displayValue || flow.value != null ? <div style={{ fontSize: 13, fontWeight: 700, color }}>{flow.displayValue || `${flow.value}${data.unit || ""}`}</div> : null}
          </div>
        )
      })}
    </AbsoluteFill>
  )
}