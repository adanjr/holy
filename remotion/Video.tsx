"use client";

import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, Html5Audio, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "./Scene";
import { getActiveWordIndex, splitSubtitleWords } from "../lib/subtitles/word-highlighting";

type SubtitlesStyle = {
  fontSize?: number;
  color?: string;
  background?: string;
  position?: "top" | "center" | "bottom";
  mode?: "classic" | "tiktok";
  highlightColor?: string;
};

type MusicTrack = {
  id: string;
  url: string;
  startTime: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
  duration: number | null;
  order: number;
  volume?: number;
};

type WaterMark = {
  url: string;
  size?: number;
  opacity?: number;
  rotation?: number;
  mode?: "SINGLE" | "TILE";
};

type LogoOverlay = {
  url: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  size?: number;
  opacity?: number;
};

type FinalCompositionProps = {
  scenes: any[];
  voiceUrl?: string | null;
  musicTracks?: MusicTrack[];
  watermark?: WaterMark;
  logo?: LogoOverlay;
  subtitles?: any[];
  subtitlesEnabled?: boolean;
  subtitlesStyle?: SubtitlesStyle;
  sceneTransition?: "NONE" | "FADE" | "SLIDE_LEFT" | "SLIDE_UP" | "ZOOM" | "ZOOM_OUT" | "BLUR";
  sceneTransitionDuration?: number;
};

const SceneVisualTransition = ({ type, durationSeconds, durationInFrames, children }: {
  type: NonNullable<FinalCompositionProps["sceneTransition"]>;
  durationSeconds: number;
  durationInFrames: number;
  children: React.ReactNode;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (type === "NONE") return <>{children}</>;

  const transitionFrames = Math.max(1, Math.min(Math.round(durationSeconds * fps), Math.floor(durationInFrames / 2)));
  const progress = interpolate(frame, [0, transitionFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const transform = type === "SLIDE_LEFT"
    ? `translateX(${interpolate(progress, [0, 1], [6, 0])}%)`
    : type === "SLIDE_UP"
      ? `translateY(${interpolate(progress, [0, 1], [6, 0])}%)`
      : type === "ZOOM"
        ? `scale(${interpolate(progress, [0, 1], [0.96, 1])})`
        : type === "ZOOM_OUT"
          ? `scale(${interpolate(progress, [0, 1], [1.06, 1])})`
          : undefined;
  const filter = type === "BLUR" ? `blur(${interpolate(progress, [0, 1], [18, 0])}px)` : undefined;

  return <AbsoluteFill style={{ opacity: progress, transform, filter, transformOrigin: "center center" }}>{children}</AbsoluteFill>;
};

export const Video = ({
  scenes,
  voiceUrl,
  musicTracks = [],
  watermark,
  logo,
  subtitles = [],
  subtitlesEnabled = false,
  subtitlesStyle = {},
  sceneTransition = "NONE",
  sceneTransitionDuration = 0.3,
}: FinalCompositionProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /**
   * Calculamos posiciones y duración total SOLO una vez
   * → evita glitches y mantiene animaciones suaves
   *
   * IMPORTANTE: cada escena se ancla a su startTime/endTime ABSOLUTO
   * (en segundos, calculado por tts-split/process-audio a partir de los
   * bookmarks de Azure). NO encadenamos duraciones una tras otra, porque
   * el audio real (voiceUrl) incluye silencios/pausas entre escenas que
   * un acumulador secuencial ignora — eso es lo que causaba el
   * desfase progresivo entre imagen y audio.
   *
   * 🔥 Además, la parte VISUAL de cada escena se sostiene hasta que arranca
   * la próxima (no hasta su propio endTime), para no dejar un hueco negro
   * durante el silencio real que hay entre narraciones. El audio no se ve
   * afectado por esto — cada escena sigue sonando exactamente en su
   * startTime/endTime real (eso lo maneja Scene.tsx con trimBefore/trimAfter).
   */
  const sequences = useMemo(() => {
    const sequences = scenes.map((scene, index) => {
      const start = scene.startTime ?? 0;
      const ownEnd = scene.endTime ?? start + (scene.duration || 5);

      const nextScene = scenes[index + 1];
      const visualEnd = nextScene ? (nextScene.startTime ?? ownEnd) : ownEnd;

      const from = Math.round(start * fps);
      const durationInFrames = Math.max(1, Math.round((visualEnd - start) * fps));

      return {
        id: scene.id || index,
        from,
        durationInFrames,
        scene,
      };
    });

    return sequences;
  }, [scenes, fps]);

  if (!scenes?.length) return null;

  const getSubtitlePosition = () => {
    switch (subtitlesStyle.position) {
      case "top":
        return {
          justifyContent: "flex-start",
          paddingTop: 80,
        };
      case "center":
        return {
          justifyContent: "center",
        };
      default:
        return {
          justifyContent: "flex-end",
          paddingBottom: 80,
        };
    }
  };

  const getPositionStyle = (position?: string) => {
    const margin = 40; // 🔥 SAFE MARGIN (esto arregla el corte)

    switch (position) {
      case "top-left":
        return { top: margin, left: margin };

      case "top-right":
        return { top: margin, right: margin };

      case "bottom-left":
        return { bottom: margin, left: margin };

      case "bottom-right":
        return { bottom: margin, right: margin };

      case "center":
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };

      default:
        return {};
    }
  };

  return (
    <AbsoluteFill className="bg-black">
      {/* 🎬 Escenas ancladas a tiempo absoluto, visual extendido hasta la siguiente */}
      {sequences.map(({ id, from, durationInFrames, scene }, index) => (
        <Sequence key={id} from={from} durationInFrames={durationInFrames}>
          <SceneVisualTransition type={index === 0 ? "NONE" : sceneTransition} durationSeconds={sceneTransitionDuration} durationInFrames={durationInFrames}>
            <Scene scene={scene} durationInFrames={durationInFrames} />
          </SceneVisualTransition>
        </Sequence>
      ))}

      {watermark?.url && watermark.mode === "SINGLE" && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <img
            src={watermark.url}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) rotate(${watermark.rotation || 0}deg)`,
              width: `${watermark.size || 30}%`,
              opacity: watermark.opacity ?? 0.15,
            }}
          />
        </AbsoluteFill>
      )}

      {watermark?.url && watermark.mode === "TILE" && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gridAutoRows: "1fr",
              width: "100%",
              height: "100%",
            }}
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  src={watermark.url}
                  style={{
                    width: `${watermark.size || 20}%`,
                    opacity: watermark.opacity ?? 0.1,
                    transform: `rotate(${watermark.rotation || 0}deg)`,
                  }}
                />
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}

      {logo?.url && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <img
            src={logo.url}
            style={{
              position: "absolute",
              ...getPositionStyle(logo.position),
              width: `${logo.size || 15}%`,
              opacity: logo.opacity ?? 1,
            }}
          />
        </AbsoluteFill>
      )}

      {/* 🎧 Audio: un solo archivo continuo, ya en tiempo absoluto real */}
      {voiceUrl && (
        <Sequence from={0}>
          <Html5Audio src={voiceUrl} />
        </Sequence>
      )}

      {/* 📝 Subtítulos */}
      {subtitlesEnabled &&
        subtitles.map((sub, index) => {
          const startFrame = Math.floor((sub.startTime ?? sub.start ?? 0) * fps);
          const end = sub.endTime ?? sub.end ?? 0;

          const durationInFrames = Math.max(
            1,
            Math.floor((end - (sub.startTime ?? sub.start ?? 0)) * fps)
          );

          const words = splitSubtitleWords(sub.text);

          const progress = (frame - startFrame) / durationInFrames;

          const safeProgress = Math.min(1, Math.max(0, progress));

          const activeWordIndex = getActiveWordIndex(words, safeProgress);

          return (
            <Sequence
              key={`subtitle-${sub.id || index}`}
              from={startFrame}
              durationInFrames={durationInFrames}
            >
              <AbsoluteFill
                style={{
                  alignItems: "center",
                  pointerEvents: "none",
                  ...getSubtitlePosition(),
                }}
              >
                <div
                  style={{
                    backgroundColor:
                      subtitlesStyle.mode === "tiktok"
                        ? "transparent"
                        : subtitlesStyle.background ?? "rgba(0,0,0,0.6)",
                    color: subtitlesStyle.color ?? "#ffffff",
                    padding: "12px 20px",
                    borderRadius: 12,
                    fontSize: subtitlesStyle.fontSize ?? 42,
                    fontWeight: "bold",
                    textAlign: "center",
                    maxWidth: "80%",
                  }}
                >
                  {subtitlesStyle.mode === "tiktok" ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      {words.map((word, i) => {
                        const isActive =
                          subtitlesStyle.mode === "tiktok" && i === activeWordIndex;

                        return (
                          <span
                            key={i}
                            style={{
                              color: isActive
                                ? subtitlesStyle.highlightColor || "#00ffcc"
                                : subtitlesStyle.color || "#ffffff",

                              textShadow: "0px 0px 12px rgba(0,0,0,0.9)",

                              transform: isActive ? "scale(1.15)" : "scale(1)",

                              transition: "all 0.15s ease",

                              fontWeight: "bold",
                            }}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    sub.text
                  )}
                </div>
              </AbsoluteFill>
            </Sequence>
          );
        })}

      {/* 🎵 Music Tracks */}
      {[...musicTracks]
        .sort((a, b) => a.order - b.order)
        .map((track) => {
          const from = Math.floor(track.startTime * fps);
          const durationInFrames = Math.max(
            1,
            Math.floor((track.endTime - track.startTime) * fps)
          );

          return (
            <Sequence key={track.id} from={from} durationInFrames={durationInFrames}>
              <Html5Audio
                src={track.url}
                startFrom={Math.floor(track.trimStart * fps)}
                endAt={Math.floor(track.trimEnd * fps)}
                volume={Math.min(1, Math.max(0, track.volume ?? 0.2))}
              />
            </Sequence>
          );
        })}
    </AbsoluteFill>
  );
};
