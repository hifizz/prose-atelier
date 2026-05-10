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

/* Languages we treat as "tool output" — rendered as a muted no-syntax-color
   panel with an OUTPUT label instead of the usual language chip. Useful for
   AI replies that paste terminal logs, stdout dumps, etc. */
const OUTPUT_LANGS = new Set([
  "output",
  "console",
  "stdout",
  "stderr",
  "terminal",
  "shell-output",
  "bash-output",
  "log",
]);

export function CodeBlock(props: Props) {
  const { className = "", children, ...rest } = props;
  const lang = extractLanguage(className) ?? props["data-lang"];
  const copyText = props["data-content"] ?? "";
  const isOutput = !!lang && OUTPUT_LANGS.has(lang.toLowerCase());

  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tooTall, setTooTall] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setTooTall(el.scrollHeight > EXPAND_THRESHOLD);
  }, [children]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const onCopy = async () => {
    if (!copyText) return;
    const ok = await copyToClipboard(copyText);
    if (!ok) return;
    if (copiedTimerRef.current !== null) {
      window.clearTimeout(copiedTimerRef.current);
    }
    setCopied(true);
    copiedTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, 2000);
  };

  const collapsed = tooTall && !expanded;

  return (
    <figure
      className="cb-figure"
      data-collapsed={collapsed || undefined}
      data-output={isOutput || undefined}
    >
      <header className="cb-header">
        <span className="cb-lang">{lang || ""}</span>
        <button
          type="button"
          className="cb-copy"
          data-copied={copied || undefined}
          onClick={onCopy}
          disabled={!copyText}
          aria-label={copied ? "Copied" : "Copy code"}
          title={copied ? "Copied" : "Copy"}
        >
          <svg
            className="cb-copy-icon cb-copy-icon-clip"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V6a2 2 0 0 1 2-2h9" />
          </svg>
          <svg
            className="cb-copy-icon cb-copy-icon-check"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
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

async function copyToClipboard(text: string): Promise<boolean> {
  // Modern path — fails on insecure contexts or when the document
  // isn't focused (some browsers reject the promise in that case).
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy path
    }
  }
  // Legacy path — synchronous, works without focus and on http://.
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function extractLanguage(className: string): string | undefined {
  const m = className.match(/language-([\w-]+)/);
  if (!m) return undefined;
  const raw = m[1];
  if (raw === "text" || raw === "plain" || raw === "txt") return undefined;
  return raw;
}
