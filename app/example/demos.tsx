"use client";

import { useEffect, useRef, useState } from "react";

/* Two demos used by app/example/page.mdx:
   - <TickingDot />   simple <Demo>-wrapped component
   - <SpeedDemo />    "controls outside the frame" pattern (the demo renders
                       its own art-demo-frame, then a chip row sits below it) */

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

/* SpeedDemo: a moving dot whose speed is controlled by chips that sit OUTSIDE
   the dark card. To do this, the component renders its own <div
   className="art-demo-frame"> and then puts the chip row in a sibling element
   below it. The MDX wraps both in <div className="art-demo">. */

type Speed = "slow" | "normal" | "fast";
const SPEED_FACTOR: Record<Speed, number> = {
  slow: 0.3,
  normal: 1,
  fast: 3,
};

export function SpeedDemo() {
  const [speed, setSpeed] = useState<Speed>("normal");
  const [t, setT] = useState(0);
  const speedRef = useRef<Speed>(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      elapsed += dt * SPEED_FACTOR[speedRef.current];
      setT(elapsed);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const x = 50 + Math.cos(t) * 32;
  const y = 50 + Math.sin(t * 1.3) * 18;

  return (
    <>
      <div className="art-demo-frame">
        <div style={{ height: 160, position: "relative" }}>
          <svg
            viewBox="0 0 100 100"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          >
            <circle
              cx={x}
              cy={y}
              r={6}
              fill="#7c5cff"
              style={{ filter: "drop-shadow(0 0 10px #7c5cff)" }}
            />
          </svg>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "0.625rem",
        }}
      >
        <div
          role="radiogroup"
          aria-label="Speed"
          style={{
            display: "flex",
            gap: "0.25rem",
            padding: "0.25rem",
            borderRadius: 999,
            background: "#f4f4f2",
          }}
        >
          {(Object.keys(SPEED_FACTOR) as Speed[]).map((k) => {
            const active = speed === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSpeed(k)}
                style={{
                  padding: "0.25rem 0.625rem",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "-0.003rem",
                  color: active ? "#000" : "rgba(0,0,0,0.5)",
                  background: active ? "#fff" : "transparent",
                  border: 0,
                  borderRadius: 999,
                  cursor: "pointer",
                  boxShadow: active
                    ? "0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)"
                    : "none",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                {k}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
