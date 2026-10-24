"use client"

import type { Feature, MultiPoint } from "geojson"
import { bbox } from "@turf/bbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion"

type MapPoint = {
  name: string
  lat: number
  lng: number
  value?: number | null
}

type Props = {
  data: {
    points: MapPoint[]
    title?: string
    markerColor?: string
    camera?: { padding?: number }
    mapStyle?: "standard" | "satellite" | "outdoors"
  }
  animation?: { durationInFrames?: number }
  theme?: {
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
    fontFamily?: string
  }
}

type ScreenPoint = MapPoint & { x: number; y: number }

export const MapboxPoints = ({ data, theme }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { delayRender, continueRender } = useDelayRender()
  const [renderHandle] = useState(() => delayRender("Drawing Mapbox points"))
  const [mapImage, setMapImage] = useState<string | null>(null)
  const [screenPoints, setScreenPoints] = useState<ScreenPoint[]>([])
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const points = useMemo(
    () => (data?.points || []).filter((point) =>
      Number.isFinite(point.lng) && Number.isFinite(point.lat),
    ),
    [data?.points],
  )

  const pointsFeature = useMemo<Feature<MultiPoint> | null>(() =>
    points.length
      ? {
          type: "Feature",
          properties: {},
          geometry: {
            type: "MultiPoint",
            coordinates: points.map((point) => [point.lng, point.lat]),
          },
        }
      : null,
  [points])

  const pointsBounds = useMemo(() => {
    if (!pointsFeature) return null
    const [west, south, east, north] = bbox(pointsFeature)
    return [[west, south], [east, north]] as [[number, number], [number, number]]
  }, [pointsFeature])

  useEffect(() => {
    if (!containerRef.current || !pointsFeature || !pointsBounds || mapRef.current) return
    if (!mapboxToken) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is required for Map Points")
    mapboxgl.accessToken = mapboxToken

    const style = data.mapStyle === "satellite"
      ? "mapbox://styles/mapbox/satellite-streets-v12"
      : data.mapStyle === "outdoors"
        ? "mapbox://styles/mapbox/outdoors-v12"
        : "mapbox://styles/mapbox/streets-v12"
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: [points[0].lng, points[0].lat],
      zoom: points.length === 1 ? 6 : 3,
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
      setScreenPoints(points.map((point) => {
        const projected = map.project([point.lng, point.lat])
        return { ...point, x: projected.x, y: projected.y }
      }))
      try {
        setMapImage(map.getCanvas().toDataURL("image/png"))
      } catch (error) {
        console.error("Unable to freeze Map Points", error)
      }
      continueRender(renderHandle)
    }

    map.on("load", () => {
      if (points.length === 1) {
        map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: 6 })
      } else {
        const requestedPadding = data.camera?.padding ?? 64
        const focusedPadding = Math.max(40, Math.min(80, requestedPadding))
        map.fitBounds(pointsBounds, {
          padding: focusedPadding,
          animate: false,
        })
      }
      map.once("idle", complete)
    })
    map.on("error", (event) => {
      console.error("Map Points Mapbox error", event.error)
      complete()
    })

    return () => {
      if (!completed) continueRender(renderHandle)
      mapRef.current = null
      map.remove()
    }
  }, [continueRender, data.camera?.padding, data.mapStyle, mapboxToken, points, pointsBounds, pointsFeature, renderHandle])

  if (!pointsFeature || !pointsBounds) return null

  const markerColor = data.markerColor || theme?.primaryColor || "#0ea5e9"
  const fontFamily = theme?.fontFamily || "Arial, sans-serif"

  return (
    <AbsoluteFill style={{ backgroundColor: theme?.backgroundColor || "#e8edf2" }}>
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

      {data.title ? (
        <div
          style={{
            position: "absolute",
            left: 34,
            top: 28,
            maxWidth: "calc(100% - 68px)",
            opacity: interpolate(frame, [4, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            padding: "11px 18px",
            borderRadius: 7,
            background: "rgba(4,12,24,.84)",
            borderLeft: "6px solid " + markerColor,
            color: "#ffffff",
            fontFamily,
            fontSize: 28,
            fontWeight: 850,
            boxShadow: "0 8px 24px rgba(0,0,0,.35)",
          }}
        >
          {data.title}
        </div>
      ) : null}

      {screenPoints.map((point, index) => {
        const delay = 10 + index * 9
        const progress = spring({
          frame: Math.max(0, frame - delay),
          fps,
          config: { damping: 16, stiffness: 120 },
        })
        const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
        return (
          <div
            key={`${point.name}-${index}`}
            style={{
              position: "absolute",
              left: point.x,
              top: point.y,
              transform: `translate(-50%, -50%) scale(${progress})`,
              opacity,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontFamily,
            }}
          >
            <div
              style={{
                minWidth: 46,
                height: 46,
                padding: point.value != null ? "0 10px" : 0,
                borderRadius: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "3px solid #ffffff",
                background: markerColor,
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 800,
                boxShadow: `0 0 0 8px ${markerColor}33, 0 8px 24px rgba(0,0,0,.35)`,
              }}
            >
              {point.value != null
                ? new Intl.NumberFormat().format(point.value)
                : <span style={{ width: 10, height: 10, borderRadius: 5, background: "#ffffff" }} />}
            </div>
            <div
              style={{
                marginTop: 7,
                padding: "6px 10px",
                borderRadius: 6,
                background: "rgba(4,12,24,.82)",
                borderLeft: `4px solid ${markerColor}`,
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 700,
                whiteSpace: "nowrap",
                boxShadow: "0 5px 16px rgba(0,0,0,.35)",
              }}
            >
              {point.name}
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}