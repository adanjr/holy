"use client"

import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson"
import { bbox } from "@turf/bbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useMemo, useRef, useState } from "react"
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useDelayRender, useVideoConfig } from "remotion"

type Region = {
  name: string
  isoA3: string
  value: number
  displayValue?: string
  color: string
  feature: Feature<Polygon | MultiPolygon>
}

type Props = {
  data: {
    title?: string
    unit?: string
    regions: Region[]
    mapStyle?: "standard" | "satellite" | "outdoors"
  }
  theme?: { backgroundColor?: string; fontFamily?: string }
}

type RegionLabel = { x: number; y: number; name: string; displayValue: string; color: string }

export const MapboxChoropleth = ({ data, theme }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { delayRender, continueRender } = useDelayRender()
  const [renderHandle] = useState(() => delayRender("Drawing choropleth map"))
  const [mapImage, setMapImage] = useState<string | null>(null)
  const [labels, setLabels] = useState<RegionLabel[]>([])
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const regions = data?.regions || []

  const mapBounds = useMemo(() => {
    if (!regions.length) return null
    const collection: FeatureCollection<Polygon | MultiPolygon> = {
      type: "FeatureCollection",
      features: regions.map((region) => region.feature),
    }
    const [west, south, east, north] = bbox(collection)
    return [[west, south], [east, north]] as [[number, number], [number, number]]
  }, [regions])

  const range = useMemo(() => {
    const values = regions.map((region) => region.value)
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [regions])

  useEffect(() => {
    if (!containerRef.current || !regions.length || !mapBounds || mapRef.current) return
    if (!mapboxToken) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is required for Choropleth Map")
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
      if (regions.length <= 10) {
        setLabels(regions.map((region) => {
          const regionBounds = bbox(region.feature)
          const point = map.project([(regionBounds[0] + regionBounds[2]) / 2, (regionBounds[1] + regionBounds[3]) / 2])
          return {
            x: point.x,
            y: point.y,
            name: region.name,
            displayValue: region.displayValue || `${region.value}${data.unit || ""}`,
            color: region.color,
          }
        }))
      }
      try { setMapImage(map.getCanvas().toDataURL("image/png")) }
      catch (error) { console.error("Unable to freeze Choropleth Map", error) }
      continueRender(renderHandle)
    }
    map.on("load", () => {
      regions.forEach((region, index) => {
        const id = `choropleth-region-${index}`
        map.addSource(id, { type: "geojson", data: region.feature })
        map.addLayer({ id: `${id}-fill`, type: "fill", source: id, paint: { "fill-color": region.color, "fill-opacity": 0.78 } })
        map.addLayer({ id: `${id}-outline`, type: "line", source: id, paint: { "line-color": "#ffffff", "line-width": 1.8, "line-opacity": 0.9 } })
      })
      map.fitBounds(mapBounds, { padding: { top: 100, right: 80, bottom: 120, left: 80 }, animate: false })
      map.once("idle", complete)
    })
    map.on("error", (event) => console.error("Choropleth Mapbox error", event.error))
    return () => {
      if (!completed) continueRender(renderHandle)
      mapRef.current = null
      map.remove()
    }
  }, [continueRender, data.mapStyle, data.unit, mapBounds, mapboxToken, regions, renderHandle])

  if (!regions.length || !mapBounds) return null
  const fontFamily = theme?.fontFamily || "Arial, sans-serif"
  const titleOpacity = interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <AbsoluteFill style={{ backgroundColor: theme?.backgroundColor || "#e8edf2" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, opacity: mapImage ? 0 : 1 }} />
      {mapImage ? <img src={mapImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      {data.title ? <div style={{ position: "absolute", left: 34, top: 28, opacity: titleOpacity, padding: "11px 18px", borderRadius: 7, background: "rgba(4,12,24,.82)", color: "#ffffff", fontFamily, fontSize: 27, fontWeight: 850, boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>{data.title}</div> : null}

      {labels.map((label, index) => {
        const delay = 10 + index * 4
        const progress = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 18 } })
        return (
          <div key={`${label.name}-${index}`} style={{ position: "absolute", left: label.x, top: label.y, transform: `translate(-50%, -50%) scale(${progress})`, opacity: progress, padding: "6px 9px", borderRadius: 6, border: `2px solid ${label.color}`, background: "rgba(4,12,24,.8)", color: "#ffffff", fontFamily, textAlign: "center", whiteSpace: "nowrap", boxShadow: "0 5px 16px rgba(0,0,0,.35)" }}>
            <div style={{ fontSize: 13, fontWeight: 750 }}>{label.name}</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{label.displayValue}</div>
          </div>
        )
      })}

      <div style={{ position: "absolute", left: 34, bottom: 30, width: 280, padding: "13px 16px", borderRadius: 8, background: "rgba(4,12,24,.84)", color: "#ffffff", fontFamily, boxShadow: "0 9px 26px rgba(0,0,0,.4)" }}>
        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 750 }}>{data.unit || "Value"}</div>
        <div style={{ height: 13, borderRadius: 7, background: "linear-gradient(90deg, #dbeafe, #60a5fa, #1d4ed8)" }} />
        <div style={{ marginTop: 5, display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
          <span>{new Intl.NumberFormat().format(range.min)}</span>
          <span>{new Intl.NumberFormat().format(range.max)}</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}