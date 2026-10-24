"use client"

import type { Feature, MultiPolygon, Polygon } from "geojson"
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

type CountryFeature = Feature<Polygon | MultiPolygon, {
  country?: string
  isoA3?: string
}>

type CountryHighlightData = {
  country: string
  isoA3: string
  highlightColor?: string
  feature: CountryFeature
  info?: { title?: string; lines?: string[] } | null
}

type Props = {
  data: CountryHighlightData
  animation?: { durationInFrames?: number }
  theme?: { backgroundColor?: string; textColor?: string; fontFamily?: string }
}

export const AnimatedMapHighlight = ({ data, theme }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { delayRender, continueRender } = useDelayRender()
  const [renderHandle] = useState(() => delayRender("Drawing country map"))
  const [mapImage, setMapImage] = useState<string | null>(null)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const feature = data?.feature
  const bounds = useMemo(() => {
    if (!feature) return null
    const [west, south, east, north] = bbox(feature)
    return [[west, south], [east, north]] as [[number, number], [number, number]]
  }, [feature])

  const color = data.highlightColor || "#10b981"
  const mapProgress = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const labelProgress = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const infoProgress = interpolate(frame, [30, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const labelScale = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 18 } })

  useEffect(() => {
    if (!containerRef.current || !feature || !bounds || mapRef.current) return

    const light = ["#f", "#e", "#d"].some((prefix) =>
      String(theme?.backgroundColor || "").toLowerCase().startsWith(prefix),
    )
    if (!mapboxToken) {
      throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is required for Country Highlight")
    }
    mapboxgl.accessToken = mapboxToken

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: light
        ? "mapbox://styles/mapbox/light-v11"
        : "mapbox://styles/mapbox/dark-v11",
      center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
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
      try {
        setMapImage(map.getCanvas().toDataURL("image/png"))
      } catch (error) {
        console.error("Unable to freeze Country Highlight map", error)
      }
      continueRender(renderHandle)
    }

    map.on("load", () => {

      map.addSource("selected-country", { type: "geojson", data: feature })
      map.addLayer({
        id: "selected-country-fill",
        type: "fill",
        source: "selected-country",
        paint: { "fill-color": color, "fill-opacity": 0.78 },
      })
      map.addLayer({
        id: "selected-country-outline",
        type: "line",
        source: "selected-country",
        paint: { "line-color": "#ffffff", "line-width": 5, "line-opacity": 1 },
      })
      map.fitBounds(bounds, {
        padding: data.info?.lines?.length
          ? { top: 115, right: 410, bottom: 85, left: 85 }
          : { top: 115, right: 90, bottom: 85, left: 90 },
        animate: false,
      })
      map.once("idle", complete)
    })
    map.on("error", (event) => {
      console.error("Country Highlight Mapbox error", event.error)
      complete()
    })

    return () => {
      if (!completed) continueRender(renderHandle)
      mapRef.current = null
      map.remove()
    }
  }, [bounds, color, continueRender, data.info?.lines?.length, feature, mapboxToken, renderHandle, theme?.backgroundColor])

  if (!feature || !bounds) return null
  const fontFamily = theme?.fontFamily || "Arial, sans-serif"

  return (
    <AbsoluteFill style={{ backgroundColor: theme?.backgroundColor || "#081421" }}>
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, opacity: mapImage ? 0 : mapProgress }}
      />
      {mapImage ? (
        <img
          src={mapImage}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: mapProgress }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 38,
          top: 34,
          padding: "12px 22px",
          opacity: labelProgress,
          transform: `translateY(${(1 - labelProgress) * -16}px) scale(${0.96 + labelScale * 0.04})`,
          borderRadius: 8,
          border: `3px solid ${color}`,
          background: "rgba(4,12,24,.74)",
          color: "#ffffff",
          fontFamily,
          fontSize: 34,
          fontWeight: 800,
          boxShadow: "0 10px 30px rgba(0,0,0,.4)",
        }}
      >
        {data.country}
      </div>

      {data.info?.lines?.length ? (
        <div
          style={{
            position: "absolute",
            right: 38,
            bottom: 34,
            width: 340,
            padding: "22px 24px",
            opacity: infoProgress,
            transform: `translateY(${(1 - infoProgress) * 24}px)`,
            borderLeft: `7px solid ${color}`,
            borderRadius: 8,
            background: "rgba(4,12,24,.78)",
            color: "#ffffff",
            fontFamily,
            boxShadow: "0 14px 38px rgba(0,0,0,.42)",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
            {data.info.title || data.country}
          </div>
          {data.info.lines.map((line, index) => (
            <div key={`${index}-${line}`} style={{ fontSize: 18, lineHeight: 1.45, marginTop: 6 }}>
              {line}
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  )
}