"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

/* CodeBlock is a client component that wraps Shiki's `<pre>` with chrome:
   - top header bar with language label + copy button
   - automatic collapse if the block is taller than EXPAND_THRESHOLD,
     with an Expand / Collapse toggle pinned to the bottom

   Shiki output structure (server-rendered into `children`):
     <pre class="cb-block shiki ..." data-content="...raw text..." data-lang="...">
       <code>...</code>
     </pre>

   The `data-content` attribute is added by `rehype-add-copy-content.mjs`
   so we can copy the original (untokenized) source. */

const EXPAND_THRESHOLD = 480; // px — anything taller starts collapsed

type Props = ComponentProps<"pre"> & {
  "data-content"?: string;
  "data-lang"?: string;
};

export function CodeBlock(props: Props) {
  const { className = "", children, ...rest } = props;
  const lang = extractLanguage(className) ?? props["data-lang"];
  const copyText = props["data-content"] ?? "";

  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tooTall, setTooTall] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setTooTall(el.scrollHeight > EXPAND_THRESHOLD);
  }, [children]);

  const onCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — older browsers / non-secure contexts
    }
  };

  const collapsed = tooTall && !expanded;

  return (
    <figure className="cb-figure" data-collapsed={collapsed || undefined}>
      <header className="cb-header">
        <span className="cb-lang">{lang || ""}</span>
        <button
          type="button"
          className="cb-copy"
          onClick={onCopy}
          disabled={!copyText}
          aria-label="Copy code"
        >
          {copied ? "copied" : "copy"}
        </button>
      </header>

      <div ref={bodyRef} className="cb-body">
        <pre className={`cb-block ${className}`.trim()} {...rest}>
          {children}
        </pre>
      </div>

      {tooTall && (
        <button
          type="button"
          className="cb-expand"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      )}
    </figure>
  );
}

function extractLanguage(className: string): string | undefined {
  const m = className.match(/language-([\w-]+)/);
  if (!m) return undefined;
  const raw = m[1];
  if (raw === "text" || raw === "plain" || raw === "txt") return undefined;
  return raw;
}
