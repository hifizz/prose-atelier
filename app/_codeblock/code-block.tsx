import type { ComponentProps } from "react";

/* Wraps Shiki's `<pre class="shiki shiki-themes ...">` with the article's
   chrome (padding, border-radius, scroll, optional language tag). The actual
   token coloring is done by Shiki's inline styles; this component only owns
   the OUTER frame.

   Override path: `mdx-components.tsx` maps `pre` → CodeBlock. */

export function CodeBlock(props: ComponentProps<"pre">) {
  const { className = "", children, ...rest } = props;
  // Shiki adds "shiki shiki-themes <light> <dark>" + a language class like
  // "language-tsx" via addLanguageClass. We pull the language out for the
  // corner badge.
  const lang = extractLanguage(className);

  return (
    <pre className={`cb-block ${className}`.trim()} data-lang={lang} {...rest}>
      {children}
    </pre>
  );
}

function extractLanguage(className: string): string | undefined {
  const m = className.match(/language-([\w-]+)/);
  if (!m) return undefined;
  const raw = m[1];
  // Hide noise — "text" / "plain" defaults aren't worth a badge.
  if (raw === "text" || raw === "plain" || raw === "txt") return undefined;
  return raw;
}
