import { AbsoluteFill, Video, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type FramePreset = "analog-tv" | "film-projector" | "crt-monitor" | "camcorder" | "photo-frame";
type Data = { src: string; preset?: FramePreset; title?: string; caption?: string; year?: string };
type Theme = { backgroundColor: string; textColor: string; textSecondary: string; primaryColor: string; fontFamily: string };

export const FramedFootage = ({ data, theme }: { data: Data; animation?: Record<string, unknown>; theme: Theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 82 } });
  const preset = data.preset || "analog-tv";
  const analog = preset === "analog-tv";
  const projector = preset === "film-projector";
  const crt = preset === "crt-monitor";
  const camcorder = preset === "camcorder";
  const photo = preset === "photo-frame";
  const bodyColor = analog ? "#6d4b2f" : crt ? "#34383a" : photo ? "#e8dfcf" : "#151515";
  const radius = analog ? 44 : crt ? 28 : photo ? 4 : 14;
  const flicker = projector ? 0.9 + Math.sin(frame * 2.7) * 0.035 : 1;

  return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${theme.primaryColor}22, ${theme.backgroundColor} 62%)`, color: theme.textColor, fontFamily: theme.fontFamily, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
    <div style={{ width: analog ? 930 : photo ? 900 : 1010, transform: `translateY(${interpolate(enter, [0, 1], [45, 0])}px) scale(${interpolate(enter, [0, 1], [.9, 1])})`, opacity: enter }}>
      {data.title && <div style={{ textAlign: "center", fontSize: 34, fontWeight: 760, marginBottom: 22 }}>{data.title}</div>}
      <div style={{ position: "relative", padding: analog ? "42px 120px 74px 48px" : photo ? "34px 34px 84px" : "34px", borderRadius: radius, backgroundColor: bodyColor, boxShadow: "0 30px 75px rgba(0,0,0,.48), inset 0 0 0 2px rgba(255,255,255,.1)" }}>
        <div style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden", borderRadius: analog || crt ? 26 : 3, backgroundColor: "#050505", boxShadow: "inset 0 0 28px rgba(0,0,0,.8)" }}>
          <Video src={data.src} style={{ width: "100%", height: "100%", objectFit: "cover", filter: projector ? `sepia(.38) contrast(1.08) brightness(${flicker})` : analog || crt ? "saturate(.72) contrast(1.08)" : undefined }} />
          {(analog || crt) && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: .19, background: "repeating-linear-gradient(0deg, transparent 0 3px, #000 3px 5px)" }} />}
          {projector && <><div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 80px 22px rgba(45,25,8,.72)" }} /><div style={{ position: "absolute", left: 16, top: 0, bottom: 0, width: 2, opacity: .35, backgroundColor: "#fff", transform: `translateX(${(frame * 13) % 760}px)` }} /></>}
          {camcorder && <><div style={{ position: "absolute", inset: 24, border: "2px solid rgba(255,255,255,.75)" }} /><div style={{ position: "absolute", top: 42, left: 45, color: "#ff4242", fontSize: 20, fontWeight: 800 }}>â— REC</div><div style={{ position: "absolute", right: 46, top: 42, color: "white", fontSize: 18 }}>SP&nbsp;&nbsp; {data.year || "00:00:00"}</div></>}
        </div>
        {analog && <><div style={{ position: "absolute", right: 42, top: 80, width: 50, height: 50, borderRadius: "50%", background: "radial-gradient(circle at 38% 35%, #aaa, #252525 65%)", border: "3px solid #171717" }} /><div style={{ position: "absolute", right: 42, top: 156, width: 50, height: 50, borderRadius: "50%", background: "radial-gradient(circle at 38% 35%, #999, #252525 65%)", border: "3px solid #171717" }} /><div style={{ position: "absolute", right: 35, bottom: 78, width: 64, height: 128, opacity: .45, background: "repeating-linear-gradient(90deg, #111 0 3px, transparent 3px 7px)" }} /><div style={{ position: "absolute", left: 120, right: 180, bottom: 20, height: 26, borderLeft: "18px solid transparent", borderRight: "18px solid transparent", borderTop: "26px solid #3b2719" }} /></>}
        {photo && <div style={{ position: "absolute", left: 42, right: 42, bottom: 26, color: "#2f2a24", fontFamily: "Georgia, serif", fontSize: 24, fontStyle: "italic" }}>{data.caption || data.year || "Archival footage"}</div>}
        {projector && <div style={{ position: "absolute", left: 0, right: 0, bottom: -25, display: "flex", justifyContent: "space-between", padding: "0 34px" }}>{Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ width: 34, height: 18, backgroundColor: theme.backgroundColor }} />)}</div>}
      </div>
      {!photo && data.caption && <div style={{ textAlign: "center", marginTop: projector ? 44 : 20, color: theme.textSecondary, fontSize: 22, letterSpacing: .4 }}>{data.caption}</div>}
    </div>
  </AbsoluteFill>;
};
