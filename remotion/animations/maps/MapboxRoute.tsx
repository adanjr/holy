"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface RoutePoint {
  name: string
  lat?: number
  lng?: number
  coords?: [number, number]
}

interface MapboxRouteProps {
  data: {
    route: RoutePoint[]
    camera?: { padding?: number }
  }
  animation?: { durationInFrames?: number }
}

export const MapboxRoute = ({ data, animation }: MapboxRouteProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  if (!data?.route || data.route.length < 2) return null

  useEffect(() => {
    // Limpiar animación previa si existe
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Remover marcador previo
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }

    // Remover mapa previo
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    // Validar ruta
    const validRoute = data.route
      .map((p) => {
        if (Array.isArray(p.coords) && p.coords.length === 2) return { ...p, coords: p.coords }
        if (typeof p.lat === "number" && typeof p.lng === "number") return { ...p, coords: [p.lng, p.lat] }
        return null
      })
      .filter(Boolean) as (RoutePoint & { coords: [number, number] })[]

    if (validRoute.length < 2) return

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/dark-v11",
      center: validRoute[0].coords,
      zoom: 4,
    })
    mapRef.current = mapInstance

    mapInstance.on("load", () => {
      // Dibuja la ruta completa
      mapInstance.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: validRoute.map((p) => p.coords),
          },
        },
      })

      mapInstance.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#00ffff", "line-width": 4 },
      })

      const bounds = validRoute.reduce(
        (b, p) => b.extend(p.coords),
        new mapboxgl.LngLatBounds(validRoute[0].coords, validRoute[0].coords)
      )
      mapInstance.fitBounds(bounds, { padding: data.camera?.padding || 80 })

      // Marcador animado
      const marker = new mapboxgl.Marker({ color: "#ff0000" })
        .setLngLat(validRoute[0].coords)
        .addTo(mapInstance)
      markerRef.current = marker

      const totalFrames = animation?.durationInFrames || 180
      let frame = 0

      const animateMarker = () => {
        frame++
        const progress = frame / totalFrames
        const index = progress * (validRoute.length - 1)
        const lower = Math.floor(index)
        const upper = Math.min(lower + 1, validRoute.length - 1)
        const t = index - lower

        const [lng1, lat1] = validRoute[lower].coords
        const [lng2, lat2] = validRoute[upper].coords
        const lng = lng1 + (lng2 - lng1) * t
        const lat = lat1 + (lat2 - lat1) * t

        if (markerRef.current) markerRef.current.setLngLat([lng, lat])

        if (frame < totalFrames) {
          animationFrameRef.current = requestAnimationFrame(animateMarker)
        }
      }

      animationFrameRef.current = requestAnimationFrame(animateMarker)
    })

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (markerRef.current) markerRef.current.remove()
      if (mapRef.current) mapRef.current.remove()
      animationFrameRef.current = null
      markerRef.current = null
      mapRef.current = null
    }
  }, [data, animation])

  return <div ref={mapContainer} className="w-full h-full" />
}