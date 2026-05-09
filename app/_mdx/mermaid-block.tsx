"use client";

import { useEffect, useRef, useState } from "react";

/* MermaidBlock renders Mermaid diagrams entirely client-side. The
   library is dynamically imported so projects without any mermaid
   blocks pay zero kb. The rehype-custom-blocks plugin routes any
   ```mermaid fenced block to this component as <MermaidBlock source="..."/>. */

export function MermaidBlock({ source }: { source: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;

    (async () => {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      });

      try {
        const id = `m-${Math.random().toString(36).slice(2, 10)}`;
        const { svg } = await mermaid.render(id, source);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Mermaid render failed"
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return (
      <pre className="mermaid-error">
        <code>Mermaid error: {error}</code>
      </pre>
    );
  }

  return (
    <figure className="mermaid-block">
      <div ref={ref} className="mermaid-body" aria-label="Mermaid diagram" />
    </figure>
  );
}
