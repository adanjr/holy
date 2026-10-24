"use client"

import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson"
import { bbox } from "@turf/bbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useMemo, useRef, useState } from "react"
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useDelayRender, useVideoConfig } from "remotion"

type CountryItem = {
  name: string
  isoA3: string
  color: string
  value?: string | number
  label?: string
  feature: Feature<Polygon | MultiPolygon>
}

type Props = {
  data: {
    title?: string
    countries: CountryItem[]
    mapStyle?: "standard" | "satellite" | "outdoors"
  }
  theme?: { backgroundColor?: string; fontFamily?: string }
}

type CountryLabel = { x: number; y: number; name: string; color: string }

export const MapboxCountryComparison = ({ data, theme }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { delayRender, continueRender } = useDelayRender()
  const [renderHandle] = useState(() => delayRender("Drawing country comparison"))
  const [mapImage, setMapImage] = useState<string | null>(null)
  const [labels, setLabels] = useState<CountryLabel[]>([])
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const countries = data?.countries || []

  const comparisonBounds = useMemo(() => {
    if (!countries.length) return null
    const collection: FeatureCollection<Polygon | MultiPolygon> = {
      type: "FeatureCollection",
      features: countries.map((country) => country.feature),
    }
    const [west, south, east, north] = bbox(collection)
    return [[west, south], [east, north]] as [[number, number], [number, number]]
  }, [countries])

  useEffect(() => {
    if (!containerRef.current || !countries.length || !comparisonBounds || mapRef.current) return
    if (!mapboxToken) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is required for Country Comparison")
    mapboxgl.accessToken = mapboxToken
    const style = data.mapStyle === "satellite"
      ? "mapbox://styles/mapbox/satellite-streets-v12"
      : data.mapStyle === "outdoors"
        ? "mapbox://styles/mapbox/outdoors-v12"
        : "mapbox://styles/mapbox/streets-v12"
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: [(comparisonBounds[0][0] + comparisonBounds[1][0]) / 2, (comparisonBounds[0][1] + comparisonBounds[1][1]) / 2],
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
      setLabels(countries.map((country) => {
        const countryBounds = bbox(country.feature)
        const projected = map.project([(countryBounds[0] + countryBounds[2]) / 2, (countryBounds[1] + countryBounds[3]) / 2])
        return { x: projected.x, y: projected.y, name: country.name, color: country.color }
      }))
      try { setMapImage(map.getCanvas().toDataURL("image/png")) }
      catch (error) { console.error("Unable to freeze Country Comparison", error) }
      continueRender(renderHandle)
    }

    map.on("load", () => {
      countries.forEach((country, index) => {
        const sourceId = `comparison-country-${index}`
        map.addSource(sourceId, { type: "geojson", data: country.feature })
        map.addLayer({ id: `${sourceId}-fill`, type: "fill", source: sourceId, paint: { "fill-color": country.color, "fill-opacity": 0.72 } })
        map.addLayer({ id: `${sourceId}-outline`, type: "line", source: sourceId, paint: { "line-color": "#ffffff", "line-width": 3, "line-opacity": 1 } })
      })
      map.fitBounds(comparisonBounds, { padding: { top: 100, right: 85, bottom: 215, left: 85 }, animate: false })
      map.once("idle", complete)
    })
    map.on("error", (event) => console.error("Country Comparison Mapbox error", event.error))
    return () => {
      if (!completed) continueRender(renderHandle)
      mapRef.current = null
      map.remove()
    }
  }, [comparisonBounds, continueRender, countries, data.mapStyle, mapboxToken, renderHandle])

  if (!countries.length || !comparisonBounds) return null
  const fontFamily = theme?.fontFamily || "Arial, sans-serif"
  const titleOpacity = interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <AbsoluteFill style={{ backgroundColor: theme?.backgroundColor || "#e8edf2" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, opacity: mapImage ? 0 : 1 }} />
      {mapImage ? <img src={mapImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}

      {data.title ? (
        <div style={{ position: "absolute", left: 34, top: 28, opacity: titleOpacity, padding: "11px 18px", borderRadius: 7, background: "rgba(4,12,24,.8)", color: "#ffffff", fontFamily, fontSize: 28, fontWeight: 850, boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>{data.title}</div>
      ) : null}

      {labels.map((label, index) => {
        const delay = 12 + index * 7
        const opacity = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        return <div key={`${label.name}-${index}`} style={{ position: "absolute", left: label.x, top: label.y, transform: "translate(-50%, -50%)", opacity, padding: "7px 12px", borderRadius: 6, border: `2px solid ${label.color}`, background: "rgba(4,12,24,.8)", color: "#ffffff", fontFamily, fontSize: 16, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(0,0,0,.38)" }}>{label.name}</div>
      })}

      <div style={{ position: "absolute", left: 30, right: 30, bottom: 28, display: "grid", gridTemplateColumns: `repeat(${countries.length}, minmax(0, 1fr))`, gap: 12 }}>
        {countries.map((country, index) => {
          const delay = 22 + index * 8
          const progress = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 17 } })
          return (
            <div key={`${country.isoA3}-${index}`} style={{ transform: `translateY(${(1 - progress) * 28}px)`, opacity: progress, padding: "14px 16px", borderRadius: 8, borderTop: `6px solid ${country.color}`, background: "rgba(4,12,24,.86)", color: "#ffffff", fontFamily, boxShadow: "0 10px 28px rgba(0,0,0,.38)" }}>
              <div style={{ fontSize: 19, fontWeight: 850 }}>{country.name}</div>
              {country.value != null && String(country.value) ? <div style={{ marginTop: 4, fontSize: 25, fontWeight: 900, color: country.color }}>{String(country.value)}</div> : null}
              {country.label ? <div style={{ marginTop: 3, fontSize: 13, opacity: 0.82 }}>{country.label}</div> : null}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}