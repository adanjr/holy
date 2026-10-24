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

type ZoomStage = {
  name: string
  coords: [number, number]
  zoom?: number
  subtitle?: string
}

type Props = {
  data: {
    stages: ZoomStage[]
    mapStyle?: "standard" | "satellite" | "outdoors"
  }
  animation?: { durationInFrames?: number }
  theme?: { primaryColor?: string; backgroundColor?: string; fontFamily?: string }
}

export const MapboxLocationZoom = ({ data, animation, theme }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const frame = useCurrentFrame()
  const video = useVideoConfig()
  const { delayRender, continueRender } = useDelayRender()
  const [renderHandle] = useState(() => delayRender("Capturing Location Zoom levels"))
  const [images, setImages] = useState<string[]>([])
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const stages = useMemo(
    () => (data?.stages || []).filter((stage) =>
      Array.isArray(stage.coords) && stage.coords.length === 2 &&
      stage.coords.every(Number.isFinite),
    ),
    [data?.stages],
  )

  const overviewBounds = useMemo(() => {
    if (!stages.length) return null
    const feature: Feature<MultiPoint> = {
      type: "Feature",
      properties: {},
      geometry: { type: "MultiPoint", coordinates: stages.map((stage) => stage.coords) },
    }
    const [west, south, east, north] = bbox(feature)
    return [[west, south], [east, north]] as [[number, number], [number, number]]
  }, [stages])

  useEffect(() => {
    if (!containerRef.current || !stages.length || !overviewBounds || mapRef.current) return
    if (!mapboxToken) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is required for Location Zoom")
    mapboxgl.accessToken = mapboxToken

    const style = data.mapStyle === "satellite"
      ? "mapbox://styles/mapbox/satellite-streets-v12"
      : data.mapStyle === "outdoors"
        ? "mapbox://styles/mapbox/outdoors-v12"
        : "mapbox://styles/mapbox/streets-v12"
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: stages[0].coords,
      zoom: 1.3,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      preserveDrawingBuffer: true,
    })
    mapRef.current = map

    let cancelled = false
    let completed = false
    const captureAfterMove = (move: () => void) => new Promise<string>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        resolve(map.getCanvas().toDataURL("image/png"))
      }
      const timeout = window.setTimeout(finish, 8000)
      map.once("idle", finish)
      move()
      map.triggerRepaint()
    })

    map.on("load", async () => {
      try {
        const captured: string[] = []
        captured.push(await captureAfterMove(() => {
          const samePoint = overviewBounds[0][0] === overviewBounds[1][0] &&
            overviewBounds[0][1] === overviewBounds[1][1]
          if (samePoint) map.jumpTo({ center: stages[0].coords, zoom: 1.3 })
          else map.fitBounds(overviewBounds, { padding: 150, maxZoom: 3, animate: false })
        }))
        for (let index = 0; index < stages.length; index += 1) {
          const stage = stages[index]
          const defaultZoom = index === stages.length - 1 ? 13 : Math.min(10, 4 + index * 3)
          captured.push(await captureAfterMove(() =>
            map.jumpTo({ center: stage.coords, zoom: stage.zoom ?? defaultZoom }),
          ))
        }
        if (!cancelled) setImages(captured)
      } catch (error) {
        console.error("Location Zoom capture error", error)
      } finally {
        if (!completed) {
          completed = true
          continueRender(renderHandle)
        }
      }
    })
    map.on("error", (event) => console.error("Location Zoom Mapbox error", event.error))

    return () => {
      cancelled = true
      if (!completed) continueRender(renderHandle)
      mapRef.current = null
      map.remove()
    }
  }, [continueRender, data.mapStyle, mapboxToken, overviewBounds, renderHandle, stages])

  if (!stages.length || !overviewBounds) return null

  const duration = animation?.durationInFrames || video.durationInFrames
  const sequencePosition = images.length > 1
    ? interpolate(frame, [0, Math.max(1, duration - 1)], [0, images.length - 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0
  const currentIndex = Math.min(Math.floor(sequencePosition), Math.max(0, images.length - 1))
  const nextIndex = Math.min(currentIndex + 1, Math.max(0, images.length - 1))
  const transition = sequencePosition - currentIndex
  const stageIndex = Math.max(0, Math.min(stages.length - 1, Math.ceil(sequencePosition) - 1))
  const stage = stages[stageIndex]
  const labelProgress = spring({ frame: frame % Math.max(1, Math.floor(duration / (stages.length + 1))), fps: video.fps, config: { damping: 18 } })
  const accent = theme?.primaryColor || "#0ea5e9"
  const fontFamily = theme?.fontFamily || "Arial, sans-serif"

  return (
    <AbsoluteFill style={{ backgroundColor: theme?.backgroundColor || "#e8edf2", overflow: "hidden" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, opacity: images.length ? 0 : 1 }} />
      {images[currentIndex] ? (
        <img src={images[currentIndex]} alt="" style={{ position: "absolute", inset: -12, width: "calc(100% + 24px)", height: "calc(100% + 24px)", objectFit: "cover", transform: `scale(${1 + transition * 0.035})` }} />
      ) : null}
      {nextIndex !== currentIndex && images[nextIndex] ? (
        <img src={images[nextIndex]} alt="" style={{ position: "absolute", inset: -12, width: "calc(100% + 24px)", height: "calc(100% + 24px)", objectFit: "cover", opacity: interpolate(transition, [0.56, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), transform: `scale(${1.055 - transition * 0.055})` }} />
      ) : null}

      <div style={{ position: "absolute", left: 34, top: 30, display: "flex", gap: 7, alignItems: "center", fontFamily }}>
        {stages.map((item, index) => (
          <div key={`${item.name}-${index}`} style={{ display: "flex", gap: 7, alignItems: "center", opacity: index <= stageIndex ? 1 : 0.42 }}>
            {index ? <span style={{ color: "#ffffff", fontWeight: 800 }}>›</span> : null}
            <span style={{ padding: "7px 11px", borderRadius: 6, background: index === stageIndex ? accent : "rgba(4,12,24,.72)", color: "#ffffff", fontSize: 14, fontWeight: 750, boxShadow: "0 5px 15px rgba(0,0,0,.28)" }}>{item.name}</span>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: "50%", bottom: 42, transform: `translateX(-50%) scale(${0.94 + labelProgress * 0.06})`, opacity: labelProgress, minWidth: 310, padding: "15px 22px", textAlign: "center", borderRadius: 9, borderTop: `5px solid ${accent}`, background: "rgba(4,12,24,.82)", color: "#ffffff", fontFamily, boxShadow: "0 12px 34px rgba(0,0,0,.4)" }}>
        <div style={{ fontSize: 28, fontWeight: 850 }}>{stage.name}</div>
        {stage.subtitle ? <div style={{ marginTop: 5, fontSize: 16, opacity: 0.86 }}>{stage.subtitle}</div> : null}
      </div>
    </AbsoluteFill>
  )
}