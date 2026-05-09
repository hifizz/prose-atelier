"use client";

import { useEffect, useState } from "react";

/* A tiny "live" placeholder so the example article has something
   moving inside the demo frame. Replace with whatever interactive
   component your article wants to showcase. */

export function TickingDot({ accent = "#3e9fff" }: { accent?: string }) {
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const radius = 80;
  const x = 50 + Math.cos(t) * 30;
  const y = 50 + Math.sin(t * 1.3) * 18;

  return (
    <div
      style={{
        height: 160,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
        <circle
          cx={x}
          cy={y}
          r={6}
          fill={accent}
          opacity={0.95}
          style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
        />
        <circle cx={x} cy={y} r={radius / 8} fill="none" stroke={accent} strokeOpacity={0.25} />
      </svg>
      <span
        style={{
          position: "absolute",
          right: 10,
          top: 10,
          fontFamily: "SF Mono, monospace",
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: 0.4,
        }}
      >
        t = {t.toFixed(2)}s
      </span>
    </div>
  );
}
