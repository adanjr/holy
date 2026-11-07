import React from "react";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedBarChart } from "./charts/AnimatedBarChart";
import { AnimatedLineChart } from "./charts/AnimatedLineChart";
import { AnimatedDonutChart } from "./charts/AnimatedDonutChart";
import { WebScroller } from "./web/WebScroller";
import { MapboxRoute } from "./maps/MapboxRoute";
import { MapboxPoints } from "./maps/MapboxPoints";
import { AnimatedMapHighlight } from "./maps/AnimatedMapHighlight";
import { MapboxLocationZoom } from "./maps/MapboxLocationZoom";
import { MapboxCountryComparison } from "./maps/MapboxCountryComparison";
import { MapboxChoropleth } from "./maps/MapboxChoropleth";
import { MapboxMigrationFlow } from "./maps/MapboxMigrationFlow";
import { MapboxHistoricalTimeline } from "./maps/MapboxHistoricalTimeline";
import { LogoGrid } from "./images/LogoGrid";
import { LogoGridWithNames } from "./images/LogoGridWithNames";
import { TopImageGrid } from "./images/TopImageGrid";
import { TopList } from "./images/TopList";
import { ConnectedNodesAnimation } from "./images/ConnectedNodesAnimation";
import { DisclaimerScreen } from "./content/DisclaimerScreen";
import { LogoReveal } from "./branding/LogoReveal";
import { MediaOverlay } from "./content/MediaOverlay";
import { CinematicImage } from "./CinematicImage";
import { MultiPanel } from "./content/MultiPanel";
import { QuoteCard } from "./content/QuoteCard";
import { EditorialCover } from "./content/EditorialCover";
import { NewsStoryCard } from "./content/NewsStoryCard";
import { CourseIntro } from "./content/CourseIntro";
import { FeatureCards } from "./content/FeatureCards";
import { PuzzleSteps } from "./content/PuzzleSteps";
import { SpeakerSplit } from "./content/SpeakerSplit";
import { HubSpokes } from "./content/HubSpokes";
import { BulletListSlide } from "./content/BulletListSlide";
import { SideBySideComparison } from "./content/SideBySideComparison";
import { FramedFootage } from "./content/FramedFootage";
import { VideoSplit } from "./content/VideoSplit";
import { ProfessionalVideoEffects } from "./ProfessionalVideoEffects";
import { themes } from "../../lib/themes";
import { getVisualization } from "../../lib/animations/catalog";

type AnimationRendererProps = {
  scene?: any;
  data?: any;
  durationInFrames?: number;
};

export const AnimationRenderer: React.FC<AnimationRendererProps> = ({
  scene,
  data,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {
    width,
    height,
    durationInFrames: compositionDuration,
  } = useVideoConfig();

  const BASE_WIDTH = 1280;
  const BASE_HEIGHT = 720;

  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);

  const input = scene ?? data;
  if (!input) return null;

  const resolved = {
    ...input,
    data: input.data && typeof input.data === "object" ? input.data : {},
    animation:
      input.animation && typeof input.animation === "object"
        ? input.animation
        : {},
  };

  const resolvedTheme =
    themes[resolved.theme as keyof typeof themes] ?? themes.finance;

  const requestedType = resolved.type || resolved.visualization || resolved.meta?.visualCategory;
  const visualizationDefinition = getVisualization(requestedType);
  const type = visualizationDefinition?.legacyType || requestedType;
  const showDesignFinish =
    visualizationDefinition?.family !== "chart" &&
    !["bar-chart", "bars", "line-chart", "line", "donut-chart", "donut"].includes(type);

  const animationProps = {
    ...resolved.animation,
    durationInFrames:
      durationInFrames ??
      resolved.animation?.durationInFrames ??
      compositionDuration,
  };

  const sceneDuration = Math.max(
    1,
    Number(animationProps.durationInFrames || compositionDuration),
  );
  const intensity = Math.min(
    1.25,
    Math.max(0, Number(animationProps.intensity ?? 0.7)),
  );
  const introFrames = Math.min(18, Math.max(8, Math.round(sceneDuration * 0.1)));
  const outroFrames = Math.min(14, Math.max(6, Math.round(sceneDuration * 0.08)));
  const opacity = interpolate(
    frame,
    [0, introFrames, Math.max(introFrames, sceneDuration - outroFrames), sceneDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const entrance = interpolate(frame, [0, introFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sceneScale = interpolate(entrance, [0, 1], [1 + 0.012 * intensity, 1]);
  const sceneOffset = interpolate(entrance, [0, 1], [8 * intensity, 0]);
  const lastFrame = Math.max(1, sceneDuration - 1);
  const progress = Math.min(1, Math.max(0, frame / lastFrame));
  const motionProgressByPreset: Record<string, number> = {
    energetic: interpolate(progress, [0, 0.72, 1], [0, 1, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
    smooth: Easing.inOut(Easing.cubic)(progress),
    cinematic: Easing.inOut(Easing.quad)(Math.pow(progress, 1.35)),
    minimal: progress,
  };
  const motionProgress =
    motionProgressByPreset[resolved.motionPreset] ?? motionProgressByPreset.smooth;
  const motionFrame = Math.round(motionProgress * lastFrame);

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
        );

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
        );

      case "donut-chart":
      case "donut":
        return (
          <AnimatedDonutChart
            title={resolved.title}
            data={resolved.data}
            theme={resolvedTheme}
            animation={animationProps}
          />
        );

      case "article-scroll":
      case "web":
        return (
          <WebScroller
            mode={type === "article-scroll" ? "article" : "page"}
            url={resolved.data.url}
            showUrl={resolved.data.showUrl}
            urlText={resolved.data.urlText}
            scrollPercent={resolved.data.scrollPercent}
            screenshotUrl={resolved.data.screenshotUrl}
            screenshotWidth={resolved.data.screenshotWidth}
            screenshotHeight={resolved.data.screenshotHeight}
            theme={resolvedTheme}
            animation={animationProps}
          />
        );

      case "map-route":
        return (
          <MapboxRoute
            data={resolved.data}
            theme={resolvedTheme}
            animation={{
              durationInFrames: animationProps.durationInFrames ?? 300,
            }}
          />
        );

      case "map-points":
        return (
          <MapboxPoints
            data={resolved.data}
            theme={resolvedTheme}
            animation={animationProps}
          />
        );

      case "map-historical-timeline":
        return (
          <MapboxHistoricalTimeline
            data={resolved.data}
            theme={resolvedTheme}
            animation={animationProps}
          />
        );
      case "map-migration-flow":
        return (
          <MapboxMigrationFlow
            data={resolved.data}
            theme={resolvedTheme}
            animation={animationProps}
          />
        );
      case "map-choropleth":
        return (
          <MapboxChoropleth
            data={resolved.data}
            theme={resolvedTheme}
          />
        );

      case "map-country-comparison":
        return (
          <MapboxCountryComparison
            data={resolved.data}
            theme={resolvedTheme}
          />
        );

      case "map-location-zoom":
        return (
          <MapboxLocationZoom
            data={resolved.data}
            theme={resolvedTheme}
            animation={animationProps}
          />
        );

      case "map-country-highlight":
        return (
          <AnimatedMapHighlight
            data={resolved.data}
            theme={resolvedTheme}
            animation={animationProps}
          />
        );

      case "logo-grid":
        return (
          <LogoGrid
            data={resolved.data}
            title={resolved.title}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "top-grid":
        return (
          <TopImageGrid
            data={resolved.data}
            title={resolved.title}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "top-list":
        return (
          <TopList
            data={resolved.data}
            title={resolved.title}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "logo-grid-names":
        return (
          <LogoGridWithNames
            data={resolved.data}
            title={resolved.title}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "connected-nodes":
        return (
          <ConnectedNodesAnimation
            data={resolved.data}
            title={resolved.title}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "disclaimer":
        return (
          <DisclaimerScreen
            title={resolved.title}
            data={resolved.data}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "logo-reveal":
        return (
          <LogoReveal
            data={resolved.data}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "media-overlay":
        return (
          <MediaOverlay
            data={resolved.data}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "multi-panel":
        return (
          <MultiPanel
            data={resolved.data}
            title={resolved.title}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "cinematic-image":
        return (
          <CinematicImage
            data={resolved.data}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "quote-card":
        return (
          <QuoteCard
            data={resolved.data || {}}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "editorial-cover":
        return (
          <EditorialCover
            data={resolved.data || {}}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "news-story-card":
        return (
          <NewsStoryCard
            data={resolved.data || {}}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "course-intro":
        return (
          <CourseIntro
            data={resolved.data || {}}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "feature-cards":
        return (
          <FeatureCards
            data={resolved.data || {}}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "puzzle-steps":
        return (
          <PuzzleSteps
            data={resolved.data || {}}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "speaker-split":
        return (
          <SpeakerSplit
            data={resolved.data || {}}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "hub-spokes":
        return (
          <HubSpokes
            data={resolved.data || {}}
            animation={animationProps}
            theme={resolvedTheme}
          />
        );

      case "bullet-list":
        return <BulletListSlide data={resolved.data || {}} animation={animationProps} theme={resolvedTheme} />;

      case "side-by-side-comparison":
        return <SideBySideComparison data={resolved.data || {}} animation={animationProps} theme={resolvedTheme} />;

      case "video-split":
        return <VideoSplit data={resolved.data || {}} animation={animationProps} theme={resolvedTheme} />;

      case "framed-footage":
        return <FramedFootage data={resolved.data || {}} animation={animationProps} theme={resolvedTheme} />;

      case "professional-video-effects":
        return <ProfessionalVideoEffects data={resolved.data || {}} animation={animationProps} theme={resolvedTheme} />;

      default:
        return (
          <AbsoluteFill
            style={{
              alignItems: "center",
              backgroundColor: resolvedTheme.backgroundColor,
              color: resolvedTheme.textColor,
              display: "flex",
              fontFamily: resolvedTheme.fontFamily,
              justifyContent: "center",
              padding: 80,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ color: resolvedTheme.primaryColor, fontSize: 18, fontWeight: 800, letterSpacing: 3, marginBottom: 18, textTransform: "uppercase" }}>
                Animation unavailable
              </div>
              <div style={{ fontSize: 44, fontWeight: 750 }}>
                Unsupported animation type
              </div>
              <div style={{ color: resolvedTheme.textSecondary, fontSize: 22, marginTop: 14 }}>
                {String(type || "No type provided")}
              </div>
            </div>
          </AbsoluteFill>
        );
    }
  })();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: resolvedTheme.backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          opacity,
          transform: `scale(${scale * sceneScale}) translateY(${sceneOffset}px)`,
          willChange: "transform, opacity",
          transformOrigin: "center",
        }}
      >
        <Freeze frame={motionFrame}>{content}</Freeze>
        {showDesignFinish && (
          <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 110px rgba(0,0,0,.16)" }} />
            <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: "radial-gradient(circle, currentColor .7px, transparent .8px)", backgroundSize: "7px 7px", color: resolvedTheme.textColor }} />
            <div style={{ position: "absolute", left: 34, top: 30, width: 46, height: 5, borderRadius: 99, background: resolvedTheme.primaryColor, opacity: 0.9 }} />
            <div style={{ position: "absolute", left: 34, top: 44, color: resolvedTheme.textSecondary, fontFamily: resolvedTheme.fontFamily, fontSize: 11, fontWeight: 800, letterSpacing: 2.4, textTransform: "uppercase", opacity: 0.62 }}>
              {visualizationDefinition?.family || "visual"}
            </div>
            <div style={{ position: "absolute", inset: 18, border: `1px solid ${resolvedTheme.textColor}12`, borderRadius: 18 }} />
            <div style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 3, borderRadius: 99, overflow: "hidden", background: `${resolvedTheme.textColor}0d` }}>
              <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 99, background: resolvedTheme.primaryColor, opacity: 0.72 }} />
            </div>
          </AbsoluteFill>
        )}
      </div>
    </AbsoluteFill>
  );
};
