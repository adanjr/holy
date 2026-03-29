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

// Tipos
type SceneEffect = {
  fx: string;
  startTime: number;
  duration: number;
};

type SceneAsset = {
  id: string;
  type: "IMAGE" | "VIDEO" | "ANIMATION";
  name?: string;
  originalUrl: string;
  storedUrl?: string;
  duration?: number;
  order?: number;
  animationData?: any;
  effects?: SceneEffect[];
};

type SceneModel = {
  id: string;
  assets?: SceneAsset[];
  textOverlays?: any[];
  startTime?: number;
  endTime?: number;
};

// Función para aplicar efectos sobre un asset
const applyEffects = (
  fxList: SceneEffect[] | undefined,
  frameInSequence: number,
  fps: number
): string[] => {
  if (!fxList?.length) return [];
  const transforms: string[] = [];

  fxList.forEach(({ fx, startTime, duration }) => {
    const localFrame = frameInSequence - startTime * fps;
    if (localFrame < 0 || localFrame > duration * fps) return;

    switch (fx) {
      case "zoomIn":
        transforms.push(
          `scale(${interpolate(localFrame, [0, duration * fps], [1, 1.2], {
            extrapolateRight: "clamp",
          })})`
        );
        break;
      case "zoomOut":
        transforms.push(
          `scale(${interpolate(localFrame, [0, duration * fps], [1.2, 1], {
            extrapolateRight: "clamp",
          })})`
        );
        break;
      case "panLeft":
        transforms.push(
          `translateX(${interpolate(localFrame, [0, duration * fps], [0, -100], {
            easing: Easing.linear,
          })}px)`
        );
        break;
      case "panRight":
        transforms.push(
          `translateX(${interpolate(localFrame, [0, duration * fps], [0, 100], {
            easing: Easing.linear,
          })}px)`
        );
        break;
      case "tiltUp":
        transforms.push(
          `translateY(${interpolate(localFrame, [0, duration * fps], [0, -80], {
            easing: Easing.linear,
          })}px)`
        );
        break;
      case "tiltDown":
        transforms.push(
          `translateY(${interpolate(localFrame, [0, duration * fps], [0, 80], {
            easing: Easing.linear,
          })}px)`
        );
        break;
    }
  });

  return transforms;
};

// Componente para cada asset tipo imagen
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
        transform: transforms.join(" "),
      }}
    />
  );
};

// Componente para cada asset tipo video
const VideoAsset = ({ asset }: { asset: SceneAsset }) => {
  return (
    <OffthreadVideo
      src={asset.storedUrl || asset.originalUrl}
      muted
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
};

// Scene principal
export const Scene = ({ scene, voiceUrl }: { scene: SceneModel; voiceUrl?: string | null }) => {
  const fps = 30;
  const frame = useCurrentFrame();

  if (!scene) return null;

  // 🔹 Normalizar assets
  const assets: SceneAsset[] = useMemo(() => {
    const rawAssets = scene.assets || [];
    return rawAssets
      .map((a) => ({
        id: a.id || a.asset?.id,
        type: a.type || a.asset?.type,
        name: a.name || a.asset?.name,
        originalUrl: a.originalUrl || a.asset?.originalUrl,
        storedUrl: a.storedUrl || a.asset?.storedUrl,
        duration: a.duration ?? a.asset?.duration ?? 6,
        order: a.order,
        animationData: a.animationData || a.asset?.animationData,
        effects: (a.effects || []).map((fx: any) => ({
          ...fx,
          startTime: Math.max(0, fx.startTime ?? 0),
        })),
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [scene]);

  if (!assets.length && !scene.textOverlays?.length && !voiceUrl) return null;

  // 🔹 Render text overlays
  const renderTextOverlays = () => {
    return (scene.textOverlays || []).map((overlay: any, index: number) => {
      const from = Math.floor((overlay.startTime ?? 0) * fps);
      const durationInFrames = Math.floor((overlay.duration ?? 2) * fps);

      const text = overlay.text || overlay.sceneEntity?.entity?.name || "";

      return (
        <Sequence key={overlay.id || index} from={from} durationInFrames={durationInFrames}>
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: overlay.positionY ? `${overlay.positionY * 100}%` : "50%",
                left: overlay.positionX ? `${overlay.positionX * 100}%` : "50%",
                transform: "translate(-50%, -50%)",
                color: overlay.color || "#fff",
                fontSize: overlay.fontSize ? `${overlay.fontSize}px` : "36px",
                backgroundColor: overlay.backgroundColor || "transparent",
                padding: "4px 12px",
                borderRadius: "8px",
                textAlign: "center",
                textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
                whiteSpace: "pre-wrap",
              }}
            >
              {typeof text === "string" ? text : JSON.stringify(text)}
            </div>
          </AbsoluteFill>
        </Sequence>
      );
    });
  };

  // 🔹 Render assets
  let currentStartFrame = 0;
  const renderAssets = assets.map((asset) => {
    const durationInFrames = asset.duration! * fps;

    const content =
      asset.type === "IMAGE" ? (
        <ImageAsset asset={asset} fps={fps} />
      ) : asset.type === "VIDEO" ? (
        <VideoAsset asset={asset} />
      ) : asset.type === "ANIMATION" && asset.animationData ? (
        <AnimationRenderer data={asset.animationData} durationInFrames={durationInFrames} />
      ) : null;

    const seq = (
      <Sequence key={asset.id} from={currentStartFrame} durationInFrames={durationInFrames}>
        {content}
      </Sequence>
    );

    currentStartFrame += durationInFrames;
    return seq;
  });

  // 🔹 Audio
  const startFrame = Math.floor((scene.startTime ?? 0) * fps);
  const endFrame = Math.floor((scene.endTime ?? currentStartFrame / fps) * fps);

  return (
    <AbsoluteFill className="bg-black">
      {renderAssets}
      {renderTextOverlays()}
      {voiceUrl && <Html5Audio src={voiceUrl} startFrom={startFrame} endAt={endFrame} />}
    </AbsoluteFill>
  );
};