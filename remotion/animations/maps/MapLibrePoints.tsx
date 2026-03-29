"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion"

interface PointItem {
  name: string
  lat: number
  lng: number
  value?: number | null
}

interface MapLibrePointsProps {
  data: {
    points: PointItem[]
    camera?: { padding?: number }
  }
  animation?: {
    durationInFrames?: number
  }
}

export const MapLibrePoints = ({ data, animation }: MapLibrePointsProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  if (!data?.points?.length) return null

  const duration = animation?.durationInFrames ?? fps * 4

  const progress = interpolate(frame, [0, duration], [0, 1], {
    extrapolateRight: "clamp",
  })

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style:
        "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [data.points[0].lng, data.points[0].lat],
      zoom: 3.2,
      pitch: 30,
      attributionControl: false,
    })

    mapRef.current = map

    map.on("load", () => {
      setTimeout(() => map.resize(), 200)

      const bounds = new maplibregl.LngLatBounds()

      data.points.forEach((p) => bounds.extend([p.lng, p.lat]))

      map.fitBounds(bounds, {
        padding: data.camera?.padding ?? 80,
        duration: 0,
      })

      // crear marcadores
      data.points.forEach((point) => {
        const wrapper = document.createElement("div")
        wrapper.style.display = "flex"
        wrapper.style.flexDirection = "column"
        wrapper.style.alignItems = "center"
        wrapper.style.opacity = "0"
        wrapper.style.transform = "scale(.5)"
        wrapper.style.transition = "all .4s ease"

        const circle = document.createElement("div")
        circle.style.width = "44px"
        circle.style.height = "44px"
        circle.style.borderRadius = "50%"
        circle.style.background =
          "linear-gradient(135deg,#00e5ff,#00bcd4)"
        circle.style.display = "flex"
        circle.style.alignItems = "center"
        circle.style.justifyContent = "center"
        circle.style.fontWeight = "bold"
        circle.style.color = "#002b36"
        circle.style.fontSize = "15px"
        circle.style.boxShadow = "0 0 18px rgba(0,229,255,0.9)"
        circle.style.border = "2px solid white"

        if (point.value !== undefined && point.value !== null) {
          circle.innerText = new Intl.NumberFormat().format(point.value)
        }

        const label = document.createElement("div")
        label.innerText = point.name
        label.style.marginTop = "4px"
        label.style.fontSize = "13px"
        label.style.fontWeight = "600"
        label.style.color = "white"
        label.style.textShadow = "0 2px 4px rgba(0,0,0,0.7)"

        wrapper.appendChild(circle)
        wrapper.appendChild(label)

        const marker = new maplibregl.Marker({ element: wrapper })
          .setLngLat([point.lng, point.lat])
          .addTo(map)

        markersRef.current.push(marker)
      })
    })

    return () => map.remove()
  }, [])

  // animar aparición progresiva
  useEffect(() => {
    const visibleCount = Math.floor(progress * markersRef.current.length)

    markersRef.current.forEach((marker, index) => {
      const el = marker.getElement()

      if (index <= visibleCount) {
        el.style.opacity = "1"
        el.style.transform = "scale(1)"
      }
    })
  }, [progress])

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  )
}