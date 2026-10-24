"use client"
import { Img, useCurrentFrame, interpolate, Easing } from "remotion";

export const Scene = ({ scene }: { scene: any }) => {
  const frame = useCurrentFrame();
  const fps = 30;

  return (
    <div style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {scene.assets?.map((asset: any, idx: number) => {
        // Valores base
        let style: React.CSSProperties = {
          width: "100%",
          height: "100%",
          objectFit: "cover",
        };

        // Aplicar efectos según lista
        asset.effects?.forEach((fx: string) => {
          if (fx === "zoomIn") {
            const scale = interpolate(frame, [0, fps * 2], [1, 1.2], {
              extrapolateRight: "clamp",
            });
            style = { ...style, transform: `scale(${scale})` };
          }

          if (fx === "panLeft") {
            const translateX = interpolate(frame, [0, fps * 2], [0, -100], {
              extrapolateRight: "clamp",
              easing: Easing.linear,
            });
            style = { ...style, transform: `translateX(${translateX}px)` };
          }

          if (fx === "tiltUp") {
            const translateY = interpolate(frame, [0, fps * 2], [0, -80], {
              extrapolateRight: "clamp",
              easing: Easing.linear,
            });
            style = { ...style, transform: `translateY(${translateY}px)` };
          }
        });

        return (
          <Img
            key={idx}
            src={asset.storedUrl || asset.originalUrl}
            style={style}
          />
        );
      })}
    </div>
  );
};
