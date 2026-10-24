"use client";

import { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  Img,
  OffthreadVideo,
  Html5Audio,
} from "remotion";
import { interpolate, Easing } from "remotion";
import { AnimationRenderer } from "./animations/AnimationRenderer";
import {
  BroadcastTextOverlay,
  getBroadcastOverlayAnchor,
  getBroadcastOverlayPosition,
} from "./BroadcastTextOverlay";

export type SceneModel = {
  id: string;
  description?: string;
  narration?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;

  assets?: any[];
  sceneAssets?: any[];
  sceneEntities?: any[];
  textOverlays?: any[];
};

type SceneProps = {
  scene: SceneModel;
  voiceUrl?: string | null;
  // DuraciÃ³n total (en frames) que esta escena debe llenar visualmente.
  // Video.tsx/FinalComposition.tsx la extienden mÃ¡s allÃ¡ del endTime propio
  // de la narraciÃ³n para tapar el silencio hasta que arranca la siguiente
  // escena. Si no se pasa, se usa la duraciÃ³n natural de los assets.
  durationInFrames?: number;
};

type SceneEffect = {
  fx: string;
  startTime: number;
  duration: number;
};

type SceneAsset = {
  id: string;
  type: "IMAGE" | "VIDEO" | "ANIMATION";
  originalUrl: string;
  storedUrl?: string;
  name: string;
  order?: number;
  duration?: number;
  sourceStart?: number;
  sourceEnd?: number;
  animationData?: any;
  effects?: SceneEffect[];
};

const applyEffects = (
  fxList: SceneEffect[] | undefined,
  frameInSequence: number,
  fps: number, // AÃ±adimos fps como parÃ¡metro // (CorrecciÃ³n 2a: Usar nombre descriptivo)
): string[] => {
  if (!fxList?.length) return [];

  const transforms: string[] = [];
  // Panning an edge-to-edge image at scale(1) exposes the composition
  // background. Keep enough overscan for the full travel distance, even
  // before/after the timed effect, like a traditional Ken Burns move.
  const hasHorizontalPan = fxList.some(
    ({ fx }) => fx === "panLeft" || fx === "panRight",
  );
  const hasVerticalPan = fxList.some(
    ({ fx }) => fx === "tiltUp" || fx === "tiltDown",
  );
  // Usamos el frame relativo para calcular el tiempo
  const currentTimeInSeconds = frameInSequence / fps;

  fxList.forEach(({ fx, startTime, duration }) => {
    // Verificamos si el efecto estÃ¡ activo dentro del tiempo de la Sequence
    if (
      currentTimeInSeconds < startTime ||
      currentTimeInSeconds > startTime + duration
    ) {
      return;
    }

    // (CorrecciÃ³n 2b: localFrame corregido)
    // frameInSequence ya es relativo, solo restamos el startTime del efecto (que ahora es relativo a 0)
    const localFrame = frameInSequence - startTime * fps;

    switch (fx) {
      case "zoomIn": {
        const scale = interpolate(localFrame, [0, duration * fps], [1, 1.2], {
          extrapolateRight: "clamp",
        });
        transforms.push(`scale(${scale})`);
        break;
      }
      case "zoomOut": {
        const scale = interpolate(localFrame, [0, duration * fps], [1.2, 1], {
          extrapolateRight: "clamp",
        });
        transforms.push(`scale(${scale})`);
        break;
      }
      case "panLeft": {
        const translateX = interpolate(
          localFrame,
          [0, duration * fps],
          [0, -100],
          {
            extrapolateRight: "clamp",
            easing: Easing.linear,
          },
        );
        transforms.push(`translateX(${translateX}px)`);
        break;
      }
      case "panRight": {
        const translateX = interpolate(
          localFrame,
          [0, duration * fps],
          [0, 100],
          {
            extrapolateRight: "clamp",
            easing: Easing.linear,
          },
        );
        transforms.push(`translateX(${translateX}px)`);
        break;
      }
      case "tiltUp": {
        const translateY = interpolate(
          localFrame,
          [0, duration * fps],
          [0, -80],
          {
            extrapolateRight: "clamp",
            easing: Easing.linear,
          },
        );
        transforms.push(`translateY(${translateY}px)`);
        break;
      }
      case "tiltDown": {
        const translateY = interpolate(
          localFrame,
          [0, duration * fps],
          [0, 80],
          {
            extrapolateRight: "clamp",
            easing: Easing.linear,
          },
        );
        transforms.push(`translateY(${translateY}px)`);
        break;
      }
    }
  });

  // Keep scale last: CSS applies transform functions right-to-left, so the
  // translation remains in composition pixels instead of being magnified.
  if (hasHorizontalPan || hasVerticalPan) {
    const coverageScale = hasVerticalPan ? 1.25 : 1.18;
    transforms.push(`scale(${coverageScale})`);
  }

  return transforms;
};

const ImageAsset = ({ asset, fps }: { asset: SceneAsset; fps: number }) => {
  const frame = useCurrentFrame();
  const transforms = applyEffects(asset.effects, frame, fps);

  return (
    <Img
      src={asset.storedUrl || asset.originalUrl}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        transformOrigin: "center center",
        willChange: "transform",
        transform: transforms.join(" "),
      }}
    />
  );
};

const VideoAsset = ({ asset, fps }: { asset: SceneAsset; fps: number }) => {
  const trimBefore = Math.max(0, Math.round((asset.sourceStart ?? 0) * fps));
  const trimAfter =
    asset.sourceEnd != null
      ? Math.max(trimBefore + 1, Math.round(asset.sourceEnd * fps))
      : undefined;
  return (
    <OffthreadVideo
      src={asset.storedUrl || asset.originalUrl}
      muted
      trimBefore={trimBefore}
      trimAfter={trimAfter}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
};

export const Scene = ({
  scene,
  voiceUrl,
  durationInFrames: totalDurationOverride,
}: SceneProps) => {
  //const audioRef = useRef<HTMLAudioElement>(null);
  const fps = 30;

  // ðŸ§© Compatibilidad y NORMALIZACIÃ“N DE TIEMPOS (CorrecciÃ³n 1: NormalizaciÃ³n)
  const assets: SceneAsset[] = useMemo(() => {
    const rawAssets = scene?.assets || scene?.sceneAssets || [];

    return rawAssets.map((a: any) => {
      // Obtenemos el tiempo de inicio del asset en la escena (e.g., 0 o 4)
      const assetStartTime = a.startTime ?? 0;

      return {
        id: a.asset?.id || a.id,
        type: a.asset?.type || a.type,
        name: a.asset?.name || a.name,
        originalUrl: a.asset?.originalUrl || a.originalUrl,
        storedUrl: a.asset?.storedUrl || a.storedUrl,
        previewUrl: a.asset?.previewUrl || a.previewUrl,
        order: a.order,
        duration: a.duration ?? a.asset?.duration ?? 8,
        sourceStart: a.sourceStart ?? 0,
        sourceEnd: a.sourceEnd ?? undefined,
        animationData: a.animationEffect?.data || a.animationData,
        // Normalizamos el startTime del efecto para que sea relativo a 0
        // en la Sequence de Remotion.
        effects: (a.effects || []).map((effect: any) => ({
          ...effect,
          startTime: Math.max(0, (effect.startTime ?? 0) - assetStartTime),
        })),
      };
    });
  }, [scene]);

  if (!assets.length) return null;

  // ðŸ”½ Ordena los assets segÃºn su "order"
  const sortedAssets: SceneAsset[] = useMemo(
    () => [...assets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [assets],
  );

  // ðŸ”§ Aplica efectos segÃºn el tiempo

  // ðŸ“ Render de Text Overlays
  const renderTextOverlays = (fps: number) => {
    if (!scene?.textOverlays?.length) return null;

    return scene.textOverlays.map((overlay: any) => {
      const from = Math.floor((overlay.startTime ?? 0) * fps);
      const durationInFrames = Math.floor((overlay.duration ?? 2) * fps);

      const TextOverlay = () => {
        const frame = useCurrentFrame();
        const localFrame = frame; // frame relativo al inicio del Sequence
        // Ajustamos el frame segÃºn transitionDelay
        const adjustedFrame = Math.max(
          0,
          localFrame - (overlay.transitionDelay || 0) * fps,
        );

        // Aplicamos animationSpeed
        const effectiveDuration =
          ((overlay.duration || 2) * fps) / (overlay.animationSpeed || 1);

        // Calculamos progreso normalizado
        let progress = Math.min(adjustedFrame / effectiveDuration, 1);

        // Si hay exitEffect y estamos en los Ãºltimos frames, invertimos el progreso
        if (
          overlay.exitEffect &&
          progress >
            1 - (overlay.transitionDelay || 0) / (overlay.duration || 2)
        ) {
          const exitProgress =
            (progress -
              (1 - (overlay.transitionDelay || 0) / (overlay.duration || 2))) /
            ((overlay.transitionDelay || 0) / (overlay.duration || 2));
          progress = 1 - exitProgress;
        }

        // ðŸŽ¬ Determinar animaciÃ³n visual
        let opacity = 1;
        const anchor = getBroadcastOverlayAnchor(overlay.position);
        const safePosition = getBroadcastOverlayPosition(
          overlay.position,
          overlay.positionX,
          overlay.positionY,
        );
        let transform = anchor.transform;
        let filter = "none";
        let clipPath = "none";

        switch (overlay.effect) {
          case "fadeIn":
            opacity = interpolate(progress, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            break;
          case "zoom":
            const scale = interpolate(progress, [0, 1], [0.8, 1.1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            transform = `${anchor.transform} scale(${scale})`;
            break;
          case "slideUp":
            const y = interpolate(progress, [0, 1], [50, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            transform = `translate(${anchor.horizontal}%, calc(${anchor.vertical}% + ${y}px))`;
            break;
          case "slideLeft":
            const x = interpolate(progress, [0, 1], [100, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            transform = `translate(calc(${anchor.horizontal}% + ${x}px), ${anchor.vertical}%)`;
            break;
          case "slideRight":
            transform = `translate(calc(${anchor.horizontal}% - ${(1 - progress) * 100}px), ${anchor.vertical}%)`;
            break;
          case "slideDown":
            transform = `translate(${anchor.horizontal}%, calc(${anchor.vertical}% - ${(1 - progress) * 60}px))`;
            break;
          case "pop":
            transform = `${anchor.transform} scale(${0.65 + Math.min(1, progress * 1.15) * 0.35})`;
            break;
          case "blurIn":
            opacity = progress;
            filter = `blur(${(1 - progress) * 18}px)`;
            break;
          case "typewriter":
          case "wordReveal":
          case "wipe":
            clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
            break;
        }
        const exitProgress = Math.max(0, Math.min(1, (localFrame - durationInFrames * 0.8) / Math.max(1, durationInFrames * 0.2)));
        if (overlay.exitEffect && overlay.exitEffect !== "none" && exitProgress > 0) {
          if (overlay.exitEffect === "fadeOut") opacity *= 1 - exitProgress;
          if (overlay.exitEffect === "slideOutLeft") transform = `${anchor.transform} translateX(${-120 * exitProgress}px)`;
          if (overlay.exitEffect === "slideOutRight") transform = `${anchor.transform} translateX(${120 * exitProgress}px)`;
          if (overlay.exitEffect === "slideOutDown") transform = `${anchor.transform} translateY(${80 * exitProgress}px)`;
          if (overlay.exitEffect === "zoomOut") transform = `${anchor.transform} scale(${1 - .3 * exitProgress})`;
          if (overlay.exitEffect === "blurOut") { opacity *= 1 - exitProgress; filter = `blur(${18 * exitProgress}px)`; }
        }

        return (
          <div
            style={{
              position: "absolute",
              top: `${safePosition.top * 100}%`,
              left: `${safePosition.left * 100}%`,
              transform,
              transformOrigin: anchor.transformOrigin,
              opacity,
              filter,
              clipPath,
              maxWidth: "88%",
            }}
          >
            <BroadcastTextOverlay
              overlay={{
                ...overlay,
                text:
                  overlay.text && overlay.text !== "textOverlay"
                    ? overlay.text
                    : overlay.sceneEntity?.entity?.name || "Custom Text",
              }}
            />
          </div>
        );
      };

      return (
        <Sequence
          key={overlay.id}
          from={from}
          durationInFrames={durationInFrames}
        >
          <TextOverlay />
        </Sequence>
      );
    });
  };

  // ðŸ” Precalculamos la duraciÃ³n (en frames) de cada asset ANTES de
  // renderizar. Si el contenedor (Video.tsx/FinalComposition.tsx) pidiÃ³
  // mÃ¡s tiempo del que suman naturalmente los assets â€” por ejemplo, cuando
  // se extiende la escena para tapar el silencio hasta la siguiente â€” le
  // sumamos ese sobrante al ÃšLTIMO asset en vez de dejarlo en negro.
  //
  // IMPORTANTE: si ese Ãºltimo asset tiene efectos (zoom/pan agregados desde
  // la UI), no alcanza con alargar su Sequence â€” el efecto tiene su propia
  // duraciÃ³n fija y "interpolate" clampea al valor final apenas esa
  // duraciÃ³n se cumple, dejando la imagen congelada el resto del tiempo.
  // Por eso acÃ¡ tambiÃ©n RE-ESCALAMOS el efecto en la misma proporciÃ³n que
  // se estirÃ³ el asset, para que la animaciÃ³n siga moviÃ©ndose hasta el
  // corte real en vez de pausarse a mitad de camino.
  const { assetDurations, assetEffectsOverride } = useMemo(() => {
    const durations = sortedAssets.map((asset) => {
      const effectsDurations = asset.effects?.length
        ? asset.effects.map((fx) => fx.startTime + fx.duration)
        : [];

      const assetDurationSeconds =
        asset.type === "VIDEO"
          ? (asset.duration ?? 6)
          : (asset.duration ??
            (effectsDurations.length ? Math.max(...effectsDurations) : 3));

      return Math.max(1, Math.floor(assetDurationSeconds * fps));
    });

    const effectsOverride: (SceneEffect[] | undefined)[] = sortedAssets.map(
      () => undefined,
    );

    if (totalDurationOverride != null && durations.length) {
      const sum = durations.reduce((a, b) => a + b, 0);
      const remainder = totalDurationOverride - sum;

      if (remainder > 0) {
        const lastIndex = durations.length - 1;
        const originalLastDuration = durations[lastIndex];
        const extendedLastDuration = originalLastDuration + remainder;

        durations[lastIndex] = extendedLastDuration;

        const lastAsset = sortedAssets[lastIndex];
        if (lastAsset.effects?.length && originalLastDuration > 0) {
          const ratio = extendedLastDuration / originalLastDuration;
          effectsOverride[lastIndex] = lastAsset.effects.map((fx) => ({
            ...fx,
            startTime: fx.startTime * ratio,
            duration: fx.duration * ratio,
          }));
        }
      }
    }

    return { assetDurations: durations, assetEffectsOverride: effectsOverride };
  }, [sortedAssets, totalDurationOverride, fps]);

  // ðŸ” Render de assets en secuencia
  let currentStartFrame = 0;

  return (
    <AbsoluteFill className="bg-black items-center justify-center">
      {sortedAssets.map((asset, assetIndex) => {
        const durationInFrames = assetDurations[assetIndex];
        const effectiveAsset = assetEffectsOverride[assetIndex]
          ? { ...asset, effects: assetEffectsOverride[assetIndex] }
          : asset;

        const comp = (
          <Sequence
            key={asset.id}
            from={currentStartFrame}
            durationInFrames={durationInFrames}
            layout="none"
          >
            {asset.type === "IMAGE" && (
              <ImageAsset asset={effectiveAsset} fps={fps} />
            )}

            {asset.type === "VIDEO" && <VideoAsset asset={asset} fps={fps} />}

            {asset.type === "ANIMATION" && asset.animationData && (
              <AnimationRenderer
                data={asset.animationData}
                durationInFrames={durationInFrames}
              />
            )}
          </Sequence>
        );

        currentStartFrame += durationInFrames;
        return comp;
      })}

      {renderTextOverlays(fps)}

      {/* ðŸŽ§ Audio de la narraciÃ³n: recortamos al segmento EXACTO de esta escena
      dentro del mp3 completo del storyboard, usando trimBefore/trimAfter
      (startFrom/endAt estÃ¡n deprecated en Remotion). Antes faltaba
      trimAfter, asÃ­ que el audio nunca se detenÃ­a al terminar la
      narraciÃ³n de esta escena. */}
      {(() => {
        if (!voiceUrl) return null;

        const startTime = scene.startTime ?? 0;
        const endTime = scene.endTime ?? startTime + (scene.duration || 5);

        const startFrame = Math.round(startTime * fps);
        const endFrame = Math.round(endTime * fps);

        return (
          <Html5Audio
            src={voiceUrl}
            trimBefore={startFrame}
            trimAfter={endFrame}
          />
        );
      })()}
    </AbsoluteFill>
  );
};
