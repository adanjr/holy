"use client"

import type { Feature, LineString, Point } from "geojson"
import maplibregl, { type GeoJSONSource, type Map } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AbsoluteFill, interpolate, useCurrentFrame, useDelayRender, useVideoConfig } from "remotion"

interface RoutePoint {
  name?: string
  lat?: number
  lng?: number
  coords?: [number, number]
}

interface MapLibreRouteProps {
  data: {
    route: RoutePoint[]
    camera?: { padding?: number }
    mapStyle?: "watercolor" | "standard"
  }
  animation?: { durationInFrames?: number }
  theme?: { primaryColor?: string; backgroundColor?: string; textColor?: string; fontFamily?: string }
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

const densifyRoute = (stops: [number, number][]) => {
  const result: [number, number][] = []
  for (let segment = 0; segment < stops.length - 1; segment += 1) {
    const from = stops[segment]
    const to = stops[segment + 1]
    const samples = 50
    for (let step = 0; step < samples; step += 1) {
      const t = step / samples
      result.push([
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
      ])
    }
  }
  result.push(stops[stops.length - 1])
  return result
}

export const MapLibreRoute = ({ data, animation, theme }: MapLibreRouteProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const frame = useCurrentFrame()
  const { fps, durationInFrames, width, height } = useVideoConfig()
  const { delayRender, continueRender } = useDelayRender()
  const [loadingHandle] = useState(() => delayRender("Loading Route Map"))
  const [map, setMap] = useState<Map | null>(null)

  const stops = useMemo(
    () =>
      (data?.route ?? [])
        .map((point): [number, number] | null => {
          if (Array.isArray(point.coords) && point.coords.length === 2) return point.coords
          if (typeof point.lng === "number" && typeof point.lat === "number") {
            return [point.lng, point.lat]
          }
          return null
        })
        .filter((point): point is [number, number] => point !== null),
    [data?.route],
  )

  const route = useMemo(() => (stops.length > 1 ? densifyRoute(stops) : []), [stops])
  const routeColor =
    typeof theme?.primaryColor === "string" && theme.primaryColor.trim()
      ? theme.primaryColor
      : "#00d9ff"
  const backgroundColor = theme?.backgroundColor || "#dbeafe"
  const textColor = theme?.textColor || "#ffffff"
  const fontFamily = theme?.fontFamily || "Arial, sans-serif"
  const watercolor = data.mapStyle !== "standard"
  const stadiaApiKey = process.env.NEXT_PUBLIC_STADIA_MAPS_API_KEY
  const tileUrl =
    watercolor && stadiaApiKey
      ? `https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=${stadiaApiKey}`
      : "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"

  const duration = animation?.durationInFrames ?? durationInFrames ?? fps * 10
  const progress = useMemo(() => {
    if (stops.length < 2) return 0
    const segmentCount = stops.length - 1
    const pause = Math.min(fps * 0.55, duration / (stops.length * 4))
    const travel = Math.max(1, duration - pause * stops.length)
    const perSegment = travel / segmentCount
    let cursor = pause

    if (frame <= cursor) return 0
    for (let segment = 0; segment < segmentCount; segment += 1) {
      const end = cursor + perSegment
      if (frame <= end) {
        return clamp((segment + interpolate(frame, [cursor, end], [0, 1])) / segmentCount)
      }
      cursor = end + pause
      if (frame <= cursor) return (segment + 1) / segmentCount
    }
    return 1
  }, [duration, fps, frame, stops.length])

  const getPartialRoute = useCallback(
    (value: number): Feature<LineString> => {
      const position = clamp(value) * (route.length - 1)
      const index = Math.floor(position)
      const next = Math.min(index + 1, route.length - 1)
      const t = position - index
      const current: [number, number] = [
        route[index][0] + (route[next][0] - route[index][0]) * t,
        route[index][1] + (route[next][1] - route[index][1]) * t,
      ]
      const coordinates = route.slice(0, index + 1)
      coordinates.push(current)
      if (coordinates.length === 1) coordinates.push(current)
      return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } }
    },
    [route],
  )

  const getMovingPoint = useCallback(
    (value: number): Feature<Point> => {
      const line = getPartialRoute(value)
      const coordinates = line.geometry.coordinates.at(-1) as [number, number]
      return { type: "Feature", properties: {}, geometry: { type: "Point", coordinates } }
    },
    [getPartialRoute],
  )

  useEffect(() => {
    if (!containerRef.current || route.length < 2) return

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
          },
        },
        layers: [{
          id: "osm",
          type: "raster",
          source: "osm",
          paint: watercolor
            ? {
                "raster-saturation": -0.25,
                "raster-contrast": -0.08,
                "raster-brightness-min": 0.12,
                "raster-brightness-max": 0.96,
              }
            : undefined,
        }],
      },
      center: stops[0],
      zoom: 3,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    })

    instance.on("load", () => {
      instance.addSource("route-trace", { type: "geojson", data: getPartialRoute(0) })
      instance.addLayer({
        id: "route-shadow",
        type: "line",
        source: "route-trace",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": watercolor ? "#fffaf0" : "#ffffff",
          "line-opacity": 0.9,
          "line-width": 13,
          "line-blur": watercolor ? 1.2 : 0,
        },
      })
      instance.addLayer({
        id: "route-line",
        type: "line",
        source: "route-trace",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": routeColor,
          "line-opacity": 0.96,
          "line-width": 7,
          "line-blur": watercolor ? 0.35 : 0,
        },
      })
      instance.addSource("route-point", { type: "geojson", data: getMovingPoint(0) })
      instance.addLayer({
        id: "route-point-dot",
        type: "circle",
        source: "route-point",
        paint: {
          "circle-color": routeColor,
          "circle-radius": 9,
          "circle-stroke-color": watercolor ? "#fffaf0" : "#ffffff",
          "circle-stroke-width": 4,
        },
      })

      const bounds = stops.reduce(
        (current, coordinates) => current.extend(coordinates),
        new maplibregl.LngLatBounds(stops[0], stops[0]),
      )
      instance.fitBounds(bounds, { padding: data.camera?.padding ?? 80, animate: false })

      data.route.forEach((point, index) => {
        if (!point.name || !stops[index]) return
        const label = document.createElement("div")
        label.textContent = point.name
        label.style.cssText = watercolor
          ? `padding:7px 12px;border-radius:3px;background:rgba(255,250,240,.9);border:1px solid rgba(83,68,52,.28);color:#3f352d;font-family:${fontFamily};font-size:14px;font-weight:700;letter-spacing:.2px;white-space:nowrap;box-shadow:0 4px 14px rgba(71,55,39,.2);transform:rotate(${index % 2 ? 1 : -1}deg)`
          : `padding:5px 9px;border-radius:6px;background:${backgroundColor};border:2px solid ${routeColor};color:${textColor};font-family:${fontFamily};font-size:13px;font-weight:700;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.45)`
        new maplibregl.Marker({ element: label, anchor: "bottom", offset: [0, -8] })
          .setLngLat(stops[index])
          .addTo(instance)
      })

      instance.once("idle", () => {
        setMap(instance)
        continueRender(loadingHandle)
      })
    })

    return () => instance.remove()
  }, [backgroundColor, continueRender, data.camera?.padding, data.route, fontFamily, getMovingPoint, getPartialRoute, loadingHandle, route.length, routeColor, stops, textColor, tileUrl, watercolor])

  useEffect(() => {
    if (!map) return
    const handle = delayRender("Rendering Route Map frame")
    map.getSource<GeoJSONSource>("route-trace")?.setData(getPartialRoute(progress))
    map.getSource<GeoJSONSource>("route-point")?.setData(getMovingPoint(progress))
    map.once("idle", () => continueRender(handle))
    map.triggerRepaint()
  }, [continueRender, delayRender, getMovingPoint, getPartialRoute, map, progress])

  if (route.length < 2) return null

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <div ref={containerRef} style={{ position: "absolute", width, height }} />
      {watercolor && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            opacity: 0.2,
            mixBlendMode: "multiply",
            backgroundImage:
              "radial-gradient(circle at 18% 22%, rgba(129,104,73,.16) 0 1px, transparent 2px), radial-gradient(circle at 76% 68%, rgba(90,116,126,.12) 0 1px, transparent 2px)",
            backgroundSize: "17px 19px, 23px 29px",
          }}
        />
      )}
    </AbsoluteFill>
  )
}
