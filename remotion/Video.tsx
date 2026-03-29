"use client";

import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { AbsoluteFill, Sequence,Html5Audio } from "remotion";
import { Scene } from "./Scene";

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
  duration: number;
  order: number;
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
};

export const Video = ({ scenes, voiceUrl, musicTracks = [], watermark, logo, subtitles = [], subtitlesEnabled = false, subtitlesStyle = {}, }: FinalCompositionProps) => {
  const fps = 30;

  const frame = useCurrentFrame();

  if (!scenes?.length) return null;

  /**
   * Calculamos posiciones y duración total SOLO una vez
   * → evita glitches y mantiene animaciones suaves
   */
  const { sequences, totalDuration } = useMemo(() => {
    let currentStartFrame = 0;

    const sequences = scenes.map((scene, index) => {
      const durationInFrames = Math.max(
        1,
        (scene.duration || 5) * fps
      );

      const seq = {
        id: scene.id || index,
        from: currentStartFrame,
        durationInFrames,
        scene,
      };

      currentStartFrame += durationInFrames;

      return seq;
    });

    return { sequences, totalDuration: currentStartFrame };
  }, [scenes]);

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

  const positionStyle = getPositionStyle();

  return (
    <AbsoluteFill className="bg-black">
      {/* 🎬 Escenas encadenadas */}
      {sequences.map(({ id, from, durationInFrames, scene }) => (
        <Sequence key={id} from={from} durationInFrames={durationInFrames}>
          <Scene scene={scene} />
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

      {/* 🎧 Audio sincronizado */}
      {voiceUrl && (
        <Html5Audio src={voiceUrl} />
      )}

      {/* 📝 Subtítulos */}
      {subtitles.map((sub, index) => {
        const startFrame = Math.floor((sub.startTime ?? sub.start ?? 0) * fps);
        const end = sub.endTime ?? sub.end ?? 0;

        const durationInFrames = Math.max(
          1,
          Math.floor((end - (sub.startTime ?? sub.start ?? 0)) * fps)
        );

        const words = sub.text.split(" ");

        const progress = (frame - startFrame) / durationInFrames;

        const safeProgress = Math.min(1, Math.max(0, progress));

        const activeWordIndex = Math.floor(
          safeProgress * (words.length - 1)
        );

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
      {musicTracks
        .sort((a, b) => a.order - b.order)
        .map((track) => {
          const from = Math.floor(track.startTime * fps);
          const durationInFrames = Math.max(
            1,
            Math.floor((track.endTime - track.startTime) * fps)
          );           

          return (
            <Sequence
              key={track.id}
              from={from}
              durationInFrames={durationInFrames}
            >
              <Html5Audio
                src={track.url}
                startFrom={Math.floor(track.trimStart * fps)} // 🔥 recorte inicial
                endAt={Math.floor(track.trimEnd * fps)}       // 🔥 recorte final
                volume={0.2} // puedes hacerlo dinámico luego
              />
            </Sequence>
          );
        })}
    </AbsoluteFill>
  );
};