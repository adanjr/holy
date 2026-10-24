"use client"

import type { Feature, LineString } from "geojson"
import { bbox } from "@turf/bbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion"

type RoutePoint = {
  name?: string
  lat?: number
  lng?: number
  coords?: [number, number]
}

type Props = {
  data: {
    route: RoutePoint[]
    camera?: { padding?: number }
    mapStyle?: "watercolor" | "standard" | "satellite"
    transport?: "plane" | "car" | "motorcycle" | "ship" | null
  }
  animation?: { durationInFrames?: number }
  theme?: {
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
    fontFamily?: string
  }
}

type ScreenPoint = { x: number; y: number; name: string }

const pointOnScreenRoute = (points: ScreenPoint[], progress: number) => {
  if (!points.length) return null
  if (points.length === 1) return points[0]
  const lengths = points.slice(1).map((point, index) =>
    Math.hypot(point.x - points[index].x, point.y - points[index].y),
  )
  const total = lengths.reduce((sum, value) => sum + value, 0)
  let remaining = total * Math.max(0, Math.min(1, progress))
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index]) {
      const ratio = lengths[index] ? remaining / lengths[index] : 0
      return {
        x: points[index].x + (points[index + 1].x - points[index].x) * ratio,
        y: points[index].y + (points[index + 1].y - points[index].y) * ratio,
      }
    }
    remaining -= lengths[index]
  }
  return points.at(-1) || null
}

export const MapboxRoute = ({ data, animation, theme }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const { delayRender, continueRender } = useDelayRender()
  const [renderHandle] = useState(() => delayRender("Drawing Mapbox route"))
  const [mapImage, setMapImage] = useState<string | null>(null)
  const [screenPoints, setScreenPoints] = useState<ScreenPoint[]>([])
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const route = useMemo(
    () => (data?.route || []).flatMap((point) => {
      const coordinates = Array.isArray(point.coords)
        ? point.coords
        : typeof point.lng === "number" && typeof point.lat === "number"
          ? [point.lng, point.lat]
          : null
      return coordinates
        ? [{ coordinates: coordinates as [number, number], name: point.name || "" }]
        : []
    }),
    [data?.route],
  )

  const routeFeature = useMemo<Feature<LineString> | null>(() =>
    route.length >= 2
      ? {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: route.map((point) => point.coordinates) },
        }
      : null,
  [route])

  const routeBounds = useMemo(() => {
    if (!routeFeature) return null
    const [west, south, east, north] = bbox(routeFeature)
    return [[west, south], [east, north]] as [[number, number], [number, number]]
  }, [routeFeature])

  useEffect(() => {
    if (!containerRef.current || !routeFeature || !routeBounds || mapRef.current) return
    if (!mapboxToken) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is required for Route Map")
    mapboxgl.accessToken = mapboxToken

    const style = data.mapStyle === "satellite"
      ? "mapbox://styles/mapbox/satellite-streets-v12"
      : data.mapStyle === "watercolor"
        ? "mapbox://styles/mapbox/outdoors-v12"
        : "mapbox://styles/mapbox/streets-v12"
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: route[0].coordinates,
      zoom: 3,
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
      const projected = route.map((point) => {
        const screen = map.project(point.coordinates)
        return { x: screen.x, y: screen.y, name: point.name }
      })
      setScreenPoints(projected)
      try {
        setMapImage(map.getCanvas().toDataURL("image/png"))
      } catch (error) {
        console.error("Unable to freeze Route Map", error)
      }
      continueRender(renderHandle)
    }

    map.on("load", () => {
      map.fitBounds(routeBounds, {
        padding: data.camera?.padding ?? 105,
        animate: false,
      })
      map.once("idle", complete)
    })
    map.on("error", (event) => {
      console.error("Route Mapbox error", event.error)
      complete()
    })

    return () => {
      if (!completed) continueRender(renderHandle)
      mapRef.current = null
      map.remove()
    }
  }, [continueRender, data.camera?.padding, data.mapStyle, mapboxToken, renderHandle, route, routeBounds, routeFeature])

  if (!routeFeature || !routeBounds) return null

  const totalDuration = animation?.durationInFrames || durationInFrames
  const progress = interpolate(frame, [8, Math.max(20, totalDuration - 20)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const path = screenPoints.length
    ? `M ${screenPoints.map((point) => `${point.x} ${point.y}`).join(" L ")}`
    : ""
  const movingPoint = pointOnScreenRoute(screenPoints, progress)
  const transportIcon = data.transport === "plane"
    ? "✈︎"
    : data.transport === "car"
      ? "🚗"
      : data.transport === "motorcycle"
        ? "🏍"
        : data.transport === "ship"
          ? "🚢"
          : null
  const routeColor = theme?.primaryColor || "#00d9ff"
  const fontFamily = theme?.fontFamily || "Arial, sans-serif"

  return (
    <AbsoluteFill style={{ backgroundColor: theme?.backgroundColor || "#081421" }}>
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, opacity: mapImage ? 0 : 1 }}
      />
      {mapImage ? (
        <img
          src={mapImage}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}

      {path ? (
        <svg viewBox="0 0 1280 720" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
          <path d={path} pathLength={1} fill="none" stroke="rgba(255,255,255,.9)" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - progress} />
          <path d={path} pathLength={1} fill="none" stroke={routeColor} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - progress} />
          {movingPoint ? (
            transportIcon ? (
              <g transform={`translate(${movingPoint.x} ${movingPoint.y})`}>
                {data.transport !== "plane" ? (
                  <circle r={23} fill="rgba(255,255,255,.9)" stroke={routeColor} strokeWidth={3} />
                ) : null}
                <text
                  x={0}
                  y={data.transport === "plane" ? 3 : 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily={data.transport === "plane" ? "Segoe UI Symbol, Arial, sans-serif" : undefined}
                  fontSize={data.transport === "plane" ? 43 : 27}
                  fill={data.transport === "plane" ? "#ffffff" : undefined}
                  stroke={data.transport === "plane" ? "rgba(0,0,0,.72)" : undefined}
                  strokeWidth={data.transport === "plane" ? 4 : undefined}
                  paintOrder={data.transport === "plane" ? "stroke" : undefined}
                  style={{ filter: `drop-shadow(0 3px 4px ${routeColor})` }}
                >
                  {transportIcon}
                </text>
              </g>
            ) : (
              <g transform={`translate(${movingPoint.x} ${movingPoint.y})`}>
                <circle r={14} fill="rgba(255,255,255,.35)" />
                <circle r={8} fill={routeColor} stroke="#ffffff" strokeWidth={3} />
              </g>
            )
          ) : null}
        </svg>
      ) : null}

      {screenPoints.map((point, index) => {
        const visibleAt = screenPoints.length === 1 ? 0 : index / (screenPoints.length - 1)
        const opacity = interpolate(progress, [Math.max(0, visibleAt - 0.04), visibleAt + 0.04], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
        return (
          <div
            key={`${point.name}-${index}`}
            style={{
              position: "absolute",
              left: point.x,
              top: point.y - 18,
              transform: "translate(-50%, -100%)",
              opacity,
              padding: "7px 11px",
              borderRadius: 7,
              border: `2px solid ${routeColor}`,
              background: "rgba(4,12,24,.82)",
              color: "#ffffff",
              fontFamily,
              fontSize: 15,
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: "0 5px 18px rgba(0,0,0,.4)",
            }}
          >
            {point.name}
          </div>
        )
      })}
    </AbsoluteFill>
  )
}