# `_codeblock` — Shiki syntax highlighting

A self-contained, vendorable folder. Drop it into any Next.js + MDX project to
get build-time syntax highlighting via Shiki, including line / word / diff
highlighters, focus dimming, and error-level annotations — all opt-in through
comment markers in the code itself.

## Drop-in install (~30s)

```bash
# 1. Copy the folder
cp -r path/to/article-template/app/_codeblock <new-project>/app/_codeblock

# 2. Install peers
pnpm add @shikijs/rehype @shikijs/transformers shiki

# 3. Wire next.config.ts:
#    rehypePlugins: ["rehype-slug", "./app/_codeblock/rehype-shiki.mjs"]

# 4. Wire mdx-components.tsx:
#    import { CodeBlock } from "@/app/_codeblock";
#    return { ...components, pre: CodeBlock };

# 5. Import the CSS once (e.g. from app/_article/article.css or your global css):
#    @import "../_codeblock/code-block.css";
```

## Customize

Everything Shiki-related lives in **`rehype-shiki.mjs`** as plain JS data:
- `themes` — change to any [Shiki bundled theme](https://shiki.style/themes)
- `transformers` — add/remove from the array
- `languageAlias` — add aliases as needed

Visual chrome is in **`code-block.css`**. The CSS variables `--shiki-light-bg`,
`--shiki-dark-bg`, etc. are populated by Shiki's dual-theme output — adjust the
fallback values for the light/dark surfaces.

The **`<CodeBlock>`** React component (`code-block.tsx`) is intentionally thin —
just wraps Shiki's `<pre>` with a class hook (`.cb-block`) and an optional
language badge in the top-right corner. If you want copy buttons, language
dropdowns, "expand to fit" buttons, or any other chrome, add it here.

## Authoring notation

Comment markers (work in any language):

````md
```ts
const a = 1
const b = 2 // [!code highlight]
const c = 3 // [!code ++]
const d = 4 // [!code --]
const e = 5 // [!code focus]
const f = 6 // [!code error]
const g = 7 // [!code warning]
const h = 8 // [!code word:hello]
```
````

Meta string (after the language):

````md
```ts {1,3-5}      <!-- highlight lines 1, 3-5 -->
```ts /word/       <!-- highlight every "word" -->
````

## Why a folder, not a package?

Same answer as `_article/`. A vendorable folder has zero distribution
overhead — no `pnpm publish`, no peer-dep range maintenance, no version dance
between Shiki / Next / @next/mdx. New projects copy this folder and own their
copy from day one. If you need to fix a bug across N projects, the cost is N
copy-paste operations, which is genuinely lower than the cost of a published
package once you factor in version bumps and dependent updates.
