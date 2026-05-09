# `_mdx` — drop-in MDX renderer

A self-contained, vendorable folder that renders `.mdx` files as full
editorial articles: typography, left-rail TOC, Shiki-tokenized code blocks
(with header / copy button / collapse), Mermaid diagrams, and a single
config entry point.

Used together with a catchall route (`app/[...slug]/page.tsx`) that reads
files from a `content/` directory, you get this experience:

```bash
echo "---
title: Hello
date: 9 May, 2026
---
some prose..." > content/hello.mdx

# pnpm dev → /hello renders
```

No imports, no default exports, no `<ArticleLayout>` wrapping in the .mdx
file itself. Just frontmatter + Markdown.

## Drop-in install (~30s)

```bash
# 1. Vendor the folder
cp -r path/to/article-template/app/_mdx <new-project>/app/_mdx
cp -r path/to/article-template/app/[...slug] <new-project>/app/[...slug]
mkdir -p <new-project>/content

# 2. Install peers
pnpm add next-mdx-remote rehype-slug \
  @shikijs/rehype @shikijs/transformers shiki \
  unist-util-visit mermaid

# 3. Drop a .mdx file in content/, run pnpm dev.
```

That's it. The catchall route walks `content/` recursively and SSGs every
`.mdx` it finds.

## Files

```
_mdx/
├── article-layout.tsx        Article shell — header, TOC slot, prose column
├── article-toc.tsx           Client TOC, IntersectionObserver-driven
├── article.css               Typography + layout tokens (--art-*)
├── code-block.tsx            <CodeBlock> client comp w/ header bar, copy, expand
├── code-block.css            Code block chrome + Shiki dual-theme + transformers
├── components.tsx            MDX element overrides (h2 → divider, hr → dot)
├── fonts.ts                  Inter + Newsreader (next/font)
├── index.ts                  Public exports
├── mermaid-block.tsx         Mermaid diagram (client; dynamic-imports mermaid)
├── mermaid-block.css         Mermaid host frame
├── README.md                 (this file)
├── rehype-add-copy-content.mjs   Stamp `data-content` on <pre> for copy button
├── rehype-custom-blocks.mjs      Route ```mermaid → <MermaidBlock>
├── rehype-shiki.mjs              Pre-configured Shiki (themes + transformers + aliases)
└── renderer.tsx              <MDXArticle source={...} /> — single config entry point
```

## Frontmatter shape

```yaml
title: My article         # required
date: 9 May, 2026         # optional, shown above the title
tagline: One-line subtitle.   # optional plain text under the title
back:                     # optional, defaults to { href: "/", label: "← back" }
  href: /
  label: ← /index
toc:                      # optional, defaults to { label: "Contents" }
  label: Sections
# toc: false              # disables the TOC entirely
```

## Authoring

- Headings: `## h2` becomes a section divider AND a TOC entry. `### h3`
  is a quieter sub-heading (no line, not in TOC).
- Lists, blockquotes, em/strong, links, inline `code` — all work as plain
  Markdown.
- Code blocks: ```` ```ts ```` — Shiki tokens with full transformer set.
- Mermaid: ```` ```mermaid ```` — rendered client-side as SVG.
- Custom React components: register them in `app/[...slug]/page.tsx` via
  `components={{ MyDemo }}` and use them directly in MDX as `<MyDemo />`.

### Code block annotations

All Shiki transformers are on. Use them via comment markers in the code:

```ts
const a = 1;
const b = 2; // [!code highlight]
const c = 3; // [!code ++]
const d = 4; // [!code --]
const e = 5; // [!code focus]
const f = 6; // [!code error]
const g = 7; // [!code warning]
const h = 8; // [!code word:hello]
```

Or via the meta string after the language:

````md
```ts {1,3-5}     # highlight lines 1, 3-5
```ts /word/      # highlight every "word"
````

## Customize

Single-file knobs:

| Want to change | Edit |
|---|---|
| Shiki theme / transformer list / language aliases | `rehype-shiki.mjs` |
| Add a new fenced-block type (like ```mermaid → component) | `rehype-custom-blocks.mjs` (extend `SPECIAL` map) |
| Code block chrome (header label, copy text, expand threshold) | `code-block.tsx` |
| Article colors / spacing / typography | `article.css` (--art-* CSS variables on .art-root) |
| Fonts | `fonts.ts` |
| TOC behavior (active section logic, click handling) | `article-toc.tsx` |
| What components MDX files can use | `app/[...slug]/page.tsx` (caller passes `components`) |

The renderer (`renderer.tsx`) plumbs frontmatter → ArticleLayout and
rehype plugins into compileMDX. It's the only place you'd touch to
restructure the pipeline itself.

## Why a folder, not a package?

Same answer as before. A vendorable folder has zero distribution
overhead — no `pnpm publish`, no peer-dep range maintenance, no version
dance between Shiki / mermaid / next-mdx-remote / Next. New projects copy
this folder and own their copy from day one.
