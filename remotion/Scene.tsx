"use client";

import { useEffect, useRef, useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Img } from "remotion";
import { interpolate, Easing } from "remotion";

export type SceneModel = {
  id: string
  description?: string
  narration?: string
  startTime?: number
  endTime?: number
  duration?: number

  assets?: any[]
  sceneAssets?: any[]
  sceneEntities?: any[]
  textOverlays?: any[]
}

type SceneProps = {
  scene: SceneModel
  voiceUrl?: string | null
}

type SceneEffect = {
  fx: string;
  startTime: number;
  duration: number;
};

type SceneAsset = {
  id: string;
  type: "IMAGE" | "VIDEO";
  originalUrl: string;
  storedUrl?: string;
  name: string;
  order?: number;
  effects?: SceneEffect[];
};

export const Scene = ({ scene, voiceUrl }: SceneProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fps = 30;

  // 🔊 Sincroniza audio cuando cambia la escena
  useEffect(() => {
    if (audioRef.current && scene?.startTime != null) {
      audioRef.current.currentTime = scene.startTime;
      audioRef.current.play().catch(() => {});
    }
  }, [scene, voiceUrl]);

  // 🧩 Compatibilidad y NORMALIZACIÓN DE TIEMPOS (Corrección 1: Normalización)
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
        order: a.order,
        
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

  // 🔽 Ordena los assets según su "order"
  const sortedAssets: SceneAsset[] = useMemo(
    () => [...assets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [assets]
  );

  // 🔧 Aplica efectos según el tiempo
  const applyEffects = (
    fxList: SceneEffect[] | undefined,
    frameInSequence: number // (Corrección 2a: Usar nombre descriptivo)
  ): string[] => {
    if (!fxList?.length) return [];

    const transforms: string[] = [];
    // Usamos el frame relativo para calcular el tiempo
    const currentTimeInSeconds = frameInSequence / fps;

    fxList.forEach(({ fx, startTime, duration }) => {
      
      // Verificamos si el efecto está activo dentro del tiempo de la Sequence
      if (
        currentTimeInSeconds < startTime ||
        currentTimeInSeconds > startTime + duration
      ) {
        return;
      }
      
      // (Corrección 2b: localFrame corregido)
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
          const translateX = interpolate(localFrame, [0, duration * fps], [0, -100], {
            extrapolateRight: "clamp",
            easing: Easing.linear,
          });
          transforms.push(`translateX(${translateX}px)`);
          break;
        }
        case "panRight": {
          const translateX = interpolate(localFrame, [0, duration * fps], [0, 100], {
            extrapolateRight: "clamp",
            easing: Easing.linear,
          });
          transforms.push(`translateX(${translateX}px)`);
          break;
        }
        case "tiltUp": {
          const translateY = interpolate(localFrame, [0, duration * fps], [0, -80], {
            extrapolateRight: "clamp",
            easing: Easing.linear,
          });
          transforms.push(`translateY(${translateY}px)`);
          break;
        }
        case "tiltDown": {
          const translateY = interpolate(localFrame, [0, duration * fps], [0, 80], {
            extrapolateRight: "clamp",
            easing: Easing.linear,
          });
          transforms.push(`translateY(${translateY}px)`);
          break;
        }
      }
    });

    return transforms;
  };

  // 📝 Render de Text Overlays
const renderTextOverlays = (fps: number) => {
    if (!scene?.textOverlays?.length) return null;

    return scene.textOverlays.map((overlay: any) => {
      const from = Math.floor((overlay.startTime ?? 0) * fps);
      const durationInFrames = Math.floor((overlay.duration ?? 2) * fps);

      const TextOverlay = () => {
        const frame = useCurrentFrame();
        const localFrame = frame; // frame relativo al inicio del Sequence
        // Ajustamos el frame según transitionDelay
        const adjustedFrame = Math.max(0, localFrame - (overlay.transitionDelay || 0) * fps);

        // Aplicamos animationSpeed
        const effectiveDuration = (overlay.duration || 2) * fps / (overlay.animationSpeed || 1);

        // Calculamos progreso normalizado
        let progress = Math.min(adjustedFrame / effectiveDuration, 1);

        // Si hay exitEffect y estamos en los últimos frames, invertimos el progreso
        if (overlay.exitEffect && progress > 1 - ((overlay.transitionDelay || 0) / (overlay.duration || 2))) {
          const exitProgress = (progress - (1 - ((overlay.transitionDelay || 0) / (overlay.duration || 2)))) / ((overlay.transitionDelay || 0) / (overlay.duration || 2));
          progress = 1 - exitProgress;
        }

        // 🎬 Determinar animación visual
        let opacity = 1;
        let transform = "translate(-50%, -50%)";

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
            transform = `translate(-50%, -50%) scale(${scale})`;
            break;
          case "slideUp":
            const y = interpolate(progress, [0, 1], [50, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            transform = `translate(-50%, calc(-50% + ${y}px))`;
            break;
          case "slideLeft":
            const x = interpolate(progress, [0, 1], [100, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            transform = `translate(calc(-50% + ${x}px), -50%)`;
            break;
        }


        return (
          <div
            style={{
              position: "absolute",
              top: overlay.positionY
                ? `${overlay.positionY * 100}%`
                : "50%",
              left: overlay.positionX
                ? `${overlay.positionX * 100}%`
                : "50%",
              transform,
              color: overlay.color || "#FFFFFF",
              fontSize: overlay.fontSize ? `${overlay.fontSize}px` : "36px",
              backgroundColor: overlay.backgroundColor || "transparent",
              padding: "4px 12px",
              borderRadius: "8px",
              textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
              opacity,
              whiteSpace: "pre-wrap",
              textAlign: "center",
            }}
          >
            {overlay.sceneEntity?.entity?.name || "Text Overlay"}
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


  // 🔁 Render de assets en secuencia
  let currentStartFrame = 0;

  return (
    <AbsoluteFill className="bg-black items-center justify-center">
      {sortedAssets.map((asset) => {
        // 🧩 Calcula duración según efectos o usa 3s por defecto
        const assetDurationSeconds = Math.max(
          // Utilizamos los efectos ya normalizados
          ...(asset.effects?.map((fx) => fx.startTime + fx.duration) ?? [3])
        );
        const durationInFrames = assetDurationSeconds * fps;

        const AssetWithEffects = () => {
          // (Corrección 3: useCurrentFrame dentro de Sequence es el frame relativo)
          const frameInSequence = useCurrentFrame(); 
          const transforms = applyEffects(asset.effects, frameInSequence);

          const commonStyle: React.CSSProperties = {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: transforms.join(" "),
          };

          return asset.type === "IMAGE" ? (
            <Img src={asset.storedUrl || asset.originalUrl} style={commonStyle} />
          ) : (
            <video
              src={asset.storedUrl || asset.originalUrl}
              style={commonStyle}
              muted
              playsInline
            />
          );
        };

        const comp = (
          <Sequence
            key={asset.id}
            from={currentStartFrame}
            durationInFrames={durationInFrames}
          >
            <AssetWithEffects />
          </Sequence>
        );

        currentStartFrame += durationInFrames;
        return comp;
      })}

      {/* 📝 Text Overlays */}
      {renderTextOverlays(fps)}

      {/* 🎵 Audio opcional */}
      {voiceUrl && <audio ref={audioRef} src={voiceUrl} preload="auto" />}
    </AbsoluteFill>
  );
};