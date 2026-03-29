  "use client"

  import { useEffect, useRef } from "react"
  import maplibregl from "maplibre-gl"
  import "maplibre-gl/dist/maplibre-gl.css"
  import { useCurrentFrame, useVideoConfig, interpolate } from "remotion"
  import type { Feature, LineString } from "geojson"

  interface RoutePoint {
    lat?: number
    lng?: number
    coords?: [number, number]
  }

  interface MapLibreRouteProps {
    data: {
      route: RoutePoint[]
      camera?: { padding?: number }
    }
    animation?: {
      durationInFrames?: number
    }
  }

  export const MapLibreRoute = ({ data, animation }: MapLibreRouteProps) => {
    const mapContainer = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markerRef = useRef<maplibregl.Marker | null>(null)

    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()

    if (!data?.route || data.route.length < 2) return null

    // normalizar coordenadas
    const coordinates = data.route
      .map((p) => {
        if (Array.isArray(p.coords)) return p.coords
        if (typeof p.lat === "number" && typeof p.lng === "number")
          return [p.lng, p.lat] as [number, number]
        return null
      })
      .filter(Boolean) as [number, number][]

    const duration = animation?.durationInFrames ?? fps * 6

    const progress = interpolate(frame, [0, duration], [0, 1], {
      extrapolateRight: "clamp",
    })

    // crear mapa
    useEffect(() => {
      if (!mapContainer.current) return

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: "osm-layer",
              type: "raster",
              source: "osm",
            },
          ],
        },
        center: coordinates[0],
        zoom: 4,
      })

      mapRef.current = map

      map.on("load", () => {
        // 🔹 Ruta completa (tenue)
        const fullRoute: Feature<LineString> = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        }

        map.addSource("route-full", {
          type: "geojson",
          data: fullRoute,
        })

        map.addLayer({
          id: "route-full-line",
          type: "line",
          source: "route-full",
          paint: {
            "line-color": "#888888",
            "line-width": 4,
            "line-opacity": 0.4,
          },
        })

        // 🔹 Ruta recorrida (brillante)
        const progressFeature: Feature<LineString> = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [coordinates[0]],
          },
        }

        map.addSource("route-progress", {
          type: "geojson",
          data: progressFeature,
        })

        map.addLayer({
          id: "route-progress-line",
          type: "line",
          source: "route-progress",
          paint: {
            "line-color": "#00ffff",
            "line-width": 6,
            "line-opacity": 0.95,
          },
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
        })

        // ajustar cámara
        const bounds = coordinates.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        )

        map.fitBounds(bounds, { padding: data.camera?.padding || 80 })

        // marcador
        markerRef.current = new maplibregl.Marker({ color: "#ff0000" })
          .setLngLat(coordinates[0])
          .addTo(map)
      })

      return () => map.remove()
    }, [])

    // animación
    useEffect(() => {
      if (!mapRef.current || !markerRef.current) return

      const pathIndex = progress * (coordinates.length - 1)

      const lower = Math.floor(pathIndex)
      const upper = Math.min(lower + 1, coordinates.length - 1)
      const t = pathIndex - lower

      const [lng1, lat1] = coordinates[lower]
      const [lng2, lat2] = coordinates[upper]

      const lng = lng1 + (lng2 - lng1) * t
      const lat = lat1 + (lat2 - lat1) * t

      markerRef.current.setLngLat([lng, lat])

      // tramo recorrido
      const visitedCoords = coordinates.slice(0, lower + 1)
      visitedCoords.push([lng, lat])

      const source = mapRef.current.getSource(
        "route-progress"
      ) as maplibregl.GeoJSONSource

      if (source) {
        const feature: Feature<LineString> = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: visitedCoords,
          },
        }

        source.setData(feature)
      }
    }, [progress])

    return <div ref={mapContainer} className="w-full h-full" />
  }