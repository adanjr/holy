import React from "react"
import { AbsoluteFill, useVideoConfig } from "remotion"
import { AnimatedBarChart } from "./charts/AnimatedBarChart"
import { AnimatedLineChart } from "./charts/AnimatedLineChart"
import { AnimatedDonutChart } from "./charts/AnimatedDonutChart"
import { WebScroller } from "./web/WebScroller"
import { MapLibreRoute } from "./maps/MapLibreRoute"
import { MapLibrePoints } from "./maps/MapLibrePoints"
import { LogoGrid } from "./images/LogoGrid"
import { LogoGridWithNames } from "./images/LogoGridWithNames"
import { TopImageGrid } from "./images/TopImageGrid"
import { TopList } from "./images/TopList"
import { ConnectedNodesAnimation } from "./images/ConnectedNodesAnimation"
import { DisclaimerScreen } from "./content/DisclaimerScreen"
import { LogoReveal } from "./branding/LogoReveal"
import { MediaOverlay } from "./content/MediaOverlay"
import { MultiPanel } from "./content/MultiPanel"
import { themes } from "./UI/themes"

type AnimationRendererProps = {
  scene?: any
  data?: any
  durationInFrames?: number
}

export const AnimationRenderer: React.FC<AnimationRendererProps> = ({
  scene,
  data,
  durationInFrames,
}) => {
  const { width, height } = useVideoConfig()

  const BASE_WIDTH = 1280
  const BASE_HEIGHT = 720

  const scale = Math.min(
    width / BASE_WIDTH,
    height / BASE_HEIGHT
  )

  const resolved = scene ?? data
  if (!resolved) return null

  const resolvedTheme =
    themes[resolved.theme as keyof typeof themes] ??
    themes.finance

  const type =
    resolved.type ||
    resolved.meta?.visualCategory

  const animationProps = {
    ...resolved.animation,
    durationInFrames:
      durationInFrames ??
      resolved.animation?.durationInFrames,
  }

  const content = (() => {
    switch (type) {
      case "bar-chart":
      case "bars":
        return (
          <AnimatedBarChart
            title={resolved.title}
            data={resolved.data}
            meta={resolved.meta}
            theme={resolvedTheme}
            animation={animationProps}
          />
        )

      case "line-chart":
      case "line":
        return (
          <AnimatedLineChart
            title={resolved.title}
            data={resolved.data}
            meta={resolved.meta}
            theme={resolvedTheme}
            animation={animationProps}
          />
        )

      case "donut-chart":
      case "donut":
        return (
          <AnimatedDonutChart
            title={resolved.title}
            data={resolved.data}
            theme={resolvedTheme}
            animation={animationProps}
          />
        )

      case "web":
        return (
          <WebScroller
            url={resolved.data.url}
            animation={animationProps}
          />
        )

      case "map-route":
        return (
          <MapLibreRoute
            data={resolved.data}
            animation={{
              durationInFrames:
                animationProps.durationInFrames ?? 300,
            }}
          />
        )

      case "map-points":
        return (
          <MapLibrePoints
            data={resolved.data}
            animation={animationProps}
          />
        )

        case "logo-grid":        
          return (
            <LogoGrid
              data={resolved.data}
              title={resolved.title}
              animation={animationProps}
              theme={resolvedTheme}
            />
          )

          case "top-grid":
          return (
            <TopImageGrid
              data={resolved.data}
              title={resolved.title}
              animation={animationProps}
              theme={resolvedTheme}
            />
          )

        case "top-list":
          return (
            <TopList
              data={resolved.data}
              title={resolved.title}
              animation={animationProps}
              theme={resolvedTheme}
            />
          )

          case "logo-grid-names":
            return (
              <LogoGridWithNames
                data={resolved.data}
                title={resolved.title}
                animation={animationProps}
                theme={resolvedTheme}
              />
            )

      case "connected-nodes":
        return (
          <ConnectedNodesAnimation
            data={resolved.data}
            title={resolved.title}
            animation={animationProps}
            theme={resolvedTheme}
          />
        )

        case "disclaimer":
          return (
            <DisclaimerScreen
              title={resolved.title}
              data={resolved.data}
              animation={animationProps}
              theme={resolvedTheme}
            />
          )

          case "logo-reveal":
            return (
              <LogoReveal
                data={resolved.data}
                animation={animationProps}
                theme={resolvedTheme}
              />
            )
          
          case "media-overlay":
            return (
              <MediaOverlay
                data={resolved.data}
                animation={animationProps}
                theme={resolvedTheme}
              />
            )

            case "multi-panel":
              return (
                <MultiPanel
                  data={resolved.data}
                  title={resolved.title}
                  animation={animationProps}
                  theme={resolvedTheme}
                />
              )

      default:
        return <div>Unsupported animation type</div>
    }
  })()

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        {content}
      </div>
    </AbsoluteFill>
  )
}