/**
 *  Pre-configured Shiki rehype plugin for the article template.
 *
 *  This file is referenced as a STRING PATH from next.config.ts, which is the
 *  only plugin-spec form Turbopack can serialize. All Shiki options (themes,
 *  transformers, language aliases) live here — to customize, edit this file.
 *
 *  Adding / removing transformers is just import + push.
 *  Switching themes is two strings.
 */

import rehypeShiki from "@shikijs/rehype";
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";

/* ─── Themes (dual: light + dark, auto-applied via prefers-color-scheme) ── */
const themes = {
  light: "vitesse-light",
  dark: "vitesse-dark",
};

/* ─── Transformers ───────────────────────────────────────────────────────
 *  All opt-in via comment markers in your code, e.g.:
 *      // [!code ++]      — diff add
 *      // [!code --]      — diff remove
 *      // [!code focus]   — dim everything else
 *      // [!code highlight]
 *      // [!code error]   — red bg + level marker
 *      // [!code warning]
 *      // [!code word:foo]
 *  Or via the meta string after the language:
 *      ```ts {1,3-5}      — line highlight
 *      ```ts /word/       — word highlight
 *
 *  Each transformer is cheap; ship them all by default.
 */
const transformers = [
  transformerNotationDiff(),
  transformerNotationFocus(),
  transformerNotationHighlight(),
  transformerMetaHighlight(),
  transformerMetaWordHighlight(),
  transformerNotationWordHighlight(),
  transformerNotationErrorLevel(),
];

/* ─── Language aliases (lean — extend per-project as needed) ───────────── */
const languageAlias = {
  js: "javascript",
  ts: "typescript",
  jsx: "javascriptreact",
  tsx: "typescriptreact",
  md: "markdown",
  py: "python",
  rs: "rust",
  sh: "bash",
  zsh: "bash",
  shell: "bash",
  /* Tool / terminal output — rendered by code-block.tsx as a muted
     "OUTPUT" panel. Aliased to `text` so Shiki still produces the
     standard line structure but with no syntax coloring. */
  output: "text",
  console: "text",
  stdout: "text",
  stderr: "text",
  terminal: "text",
  log: "text",
  "shell-output": "text",
  "bash-output": "text",
};

/* ─── The plugin ─────────────────────────────────────────────────────────
 *  unified plugins are functions: (options) => transformer. We delegate
 *  to rehype-shiki with our static config and ignore any options passed
 *  by @next/mdx (it can't serialize functions anyway, so options are not
 *  expected).
 */
export default function rehypeShikiConfigured() {
  return rehypeShiki.call(this, {
    themes,
    transformers,
    addLanguageClass: true,
    defaultLanguage: "text",
    languageAlias,
  });
}
