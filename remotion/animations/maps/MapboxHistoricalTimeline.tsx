"use client"

import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson"
import { bbox } from "@turf/bbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useMemo, useRef, useState } from "react"
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useDelayRender, useVideoConfig } from "remotion"

type HistoricalArea = {
  name: string
  isoA3: string
  color: string
  feature: Feature<Polygon | MultiPolygon>
}
type HistoricalStage = {
  date: string
  title: string
  description?: string
  areas: HistoricalArea[]
}
type Props = {
  data: {
    title?: string
    stages: HistoricalStage[]
    mapStyle?: "standard" | "satellite" | "outdoors"
  }
  animation?: { durationInFrames?: number }
  theme?: { primaryColor?: string; backgroundColor?: string; fontFamily?: string }
}

export const MapboxHistoricalTimeline = ({ data, animation, theme }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const frame = useCurrentFrame()
  const video = useVideoConfig()
  const { delayRender, continueRender } = useDelayRender()
  const [renderHandle] = useState(() => delayRender("Capturing historical timeline maps"))
  const [images, setImages] = useState<string[]>([])
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const stages = data?.stages || []

  const uniqueAreas = useMemo(() => {
    const result = new Map<string, HistoricalArea>()
    stages.flatMap((stage) => stage.areas).forEach((area) => {
      if (!result.has(area.isoA3)) result.set(area.isoA3, area)
    })
    return [...result.values()]
  }, [stages])

  useEffect(() => {
    if (!containerRef.current || !stages.length || !uniqueAreas.length || mapRef.current) return
    if (!mapboxToken) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is required for Historical Timeline Map")
    mapboxgl.accessToken = mapboxToken
    const style = data.mapStyle === "satellite"
      ? "mapbox://styles/mapbox/satellite-streets-v12"
      : data.mapStyle === "outdoors"
        ? "mapbox://styles/mapbox/outdoors-v12"
        : "mapbox://styles/mapbox/streets-v12"
    const firstAreaBounds = bbox(uniqueAreas[0].feature)
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: [(firstAreaBounds[0] + firstAreaBounds[2]) / 2, (firstAreaBounds[1] + firstAreaBounds[3]) / 2],
      zoom: 2,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      preserveDrawingBuffer: true,
    })
    mapRef.current = map
    let cancelled = false
    let completed = false

    const captureStage = (stage: HistoricalStage) => new Promise<string>((resolve) => {
      const active = new Set(stage.areas.map((area) => area.isoA3))
      uniqueAreas.forEach((area, index) => {
        const current = stage.areas.find((candidate) => candidate.isoA3 === area.isoA3)
        map.setPaintProperty(`historical-fill-${index}`, "fill-opacity", active.has(area.isoA3) ? 0.76 : 0)
        map.setPaintProperty(`historical-fill-${index}`, "fill-color", current?.color || area.color)
        map.setPaintProperty(`historical-outline-${index}`, "line-opacity", active.has(area.isoA3) ? 1 : 0)
      })
      const collection: FeatureCollection<Polygon | MultiPolygon> = {
        type: "FeatureCollection",
        features: stage.areas.map((area) => area.feature),
      }
      const stageBounds = bbox(collection)
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        resolve(map.getCanvas().toDataURL("image/png"))
      }
      const timeout = window.setTimeout(finish, 8000)
      map.once("idle", finish)
      map.fitBounds([[stageBounds[0], stageBounds[1]], [stageBounds[2], stageBounds[3]]], {
        padding: { top: 130, right: 90, bottom: 170, left: 90 },
        maxZoom: 5.5,
        animate: false,
      })
      map.triggerRepaint()
    })

    map.on("load", async () => {
      uniqueAreas.forEach((area, index) => {
        const source = `historical-area-${index}`
        map.addSource(source, { type: "geojson", data: area.feature })
        map.addLayer({ id: `historical-fill-${index}`, type: "fill", source, paint: { "fill-color": area.color, "fill-opacity": 0 } })
        map.addLayer({ id: `historical-outline-${index}`, type: "line", source, paint: { "line-color": "#ffffff", "line-width": 2.5, "line-opacity": 0 } })
      })
      try {
        const captured: string[] = []
        for (const stage of stages) captured.push(await captureStage(stage))
        if (!cancelled) setImages(captured)
      } catch (error) {
        console.error("Historical Timeline capture error", error)
      } finally {
        if (!completed) {
          completed = true
          continueRender(renderHandle)
        }
      }
    })
    map.on("error", (event) => console.error("Historical Timeline Mapbox error", event.error))
    return () => {
      cancelled = true
      if (!completed) continueRender(renderHandle)
      mapRef.current = null
      map.remove()
    }
  }, [continueRender, data.mapStyle, mapboxToken, renderHandle, stages, uniqueAreas])

  if (!stages.length || !uniqueAreas.length) return null
  const duration = animation?.durationInFrames || video.durationInFrames
  const sequence = images.length > 1
    ? interpolate(frame, [0, Math.max(1, duration - 1)], [0, images.length - 0.001], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0
  const currentIndex = Math.min(stages.length - 1, Math.floor(sequence))
  const nextIndex = Math.min(stages.length - 1, currentIndex + 1)
  const transition = sequence - currentIndex
  const stage = stages[currentIndex]
  const cardProgress = spring({ frame: frame % Math.max(1, Math.floor(duration / stages.length)), fps: video.fps, config: { damping: 18 } })
  const accent = theme?.primaryColor || "#f59e0b"
  const fontFamily = theme?.fontFamily || "Arial, sans-serif"

  return (
    <AbsoluteFill style={{ backgroundColor: theme?.backgroundColor || "#e8edf2", overflow: "hidden" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, opacity: images.length ? 0 : 1 }} />
      {images[currentIndex] ? <img src={images[currentIndex]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      {nextIndex !== currentIndex && images[nextIndex] ? <img src={images[nextIndex]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: interpolate(transition, [0.65, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} /> : null}

      <div style={{ position: "absolute", left: 34, top: 28, maxWidth: 480, transform: `translateY(${(1 - cardProgress) * -18}px)`, opacity: cardProgress, padding: "16px 20px", borderRadius: 8, borderLeft: `7px solid ${stage.areas[0]?.color || accent}`, background: "rgba(4,12,24,.84)", color: "#ffffff", fontFamily, boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}>
        <div style={{ color: stage.areas[0]?.color || accent, fontSize: 18, fontWeight: 900 }}>{stage.date}</div>
        <div style={{ marginTop: 3, fontSize: 27, fontWeight: 850 }}>{stage.title}</div>
        {stage.description ? <div style={{ marginTop: 7, fontSize: 15, lineHeight: 1.4, opacity: 0.88 }}>{stage.description}</div> : null}
      </div>

      <div style={{ position: "absolute", left: 48, right: 48, bottom: 34, padding: "17px 22px 13px", borderRadius: 10, background: "rgba(4,12,24,.86)", fontFamily, boxShadow: "0 12px 34px rgba(0,0,0,.42)" }}>
        <div style={{ position: "absolute", left: 42, right: 42, top: 29, height: 4, borderRadius: 2, background: "rgba(255,255,255,.25)" }} />
        <div style={{ position: "absolute", left: 42, top: 29, width: `${stages.length === 1 ? 100 : (currentIndex / (stages.length - 1)) * 100}%`, maxWidth: "calc(100% - 84px)", height: 4, borderRadius: 2, background: accent }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 8 }}>
          {stages.map((item, index) => (
            <div key={`${item.date}-${index}`} style={{ textAlign: "center", color: "#ffffff", opacity: index <= currentIndex ? 1 : 0.5 }}>
              <div style={{ width: index === currentIndex ? 18 : 12, height: index === currentIndex ? 18 : 12, margin: index === currentIndex ? "3px auto 8px" : "6px auto 11px", borderRadius: 10, border: "3px solid #ffffff", background: index <= currentIndex ? accent : "#64748b", boxShadow: index === currentIndex ? `0 0 16px ${accent}` : "none" }} />
              <div style={{ fontSize: 13, fontWeight: 800 }}>{item.date}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}