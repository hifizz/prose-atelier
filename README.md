# article-template

A Next.js project where you drop a `.mdx` file in `content/`, run `pnpm dev`,
and get a fully rendered editorial article — typography, left-rail TOC,
Shiki-tokenized code with copy + auto-collapse, Mermaid diagrams. No
boilerplate per file.

Inspired by the typography of [benji.org/liveline](https://benji.org/liveline).
The reusable rendering pipeline lives in `app/_mdx/` as a single vendorable
folder; copy it into any new Next.js project and you get the same experience.

## Quick start

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3090>. The index links to `/example`, which is rendered
from `content/example.mdx` and demonstrates every primitive.

## Add an article

Drop a file in `content/`:

```bash
echo '---
title: My article
date: 9 May, 2026
tagline: One sentence subtitle.
---

# Body prose...

## A section heading
' > content/my-article.mdx
```

Visit `/my-article`. That's it — no imports, no `default export`, no
`<ArticleLayout>` wrapping.

Subdirectories work too: `content/series/part-1.mdx` → `/series/part-1`.

## What you get for free

- **Editorial typography** — Inter sans + Newsreader serif italic, soft cream
  surfaces, scoped under `.art-root`.
- **Left-rail TOC** — auto-built from `## h2` headings, IntersectionObserver
  active-section tracking, hidden under 1100px.
- **Code blocks** — Shiki dual-theme tokenization (vitesse-light / -dark),
  full transformer set (diff, focus, line/word highlight, error/warning),
  language label + copy button + auto-collapse on tall blocks.
- **Mermaid diagrams** — fenced ` ```mermaid ` blocks render as SVG via the
  `mermaid` library (dynamic-imported, zero kb cost when unused).
- **Frontmatter knobs** — `title`, `date`, `tagline`, `back: { href, label }`,
  `toc: { label } | false`.

## Project layout

```
app/
├── _mdx/                 reusable MDX renderer — vendorable folder
├── _demos/               project-specific React components for use inside MDX
├── [...slug]/page.tsx    catchall route, walks content/ recursively, SSGs
├── layout.tsx            root <html> shell
├── page.tsx              project index (links to /example)
└── globals.css           page-level reset
content/
└── example.mdx           a working article exercising every primitive
```

The point of separating `app/_mdx/` and `app/_demos/`: the former is
*generic*, vendorable as-is into any project. The latter is *project-specific*
React components that each particular project's articles want to call by
name. The catchall route at `app/[...slug]/page.tsx` is the integration
seam — it imports both and hands them to the renderer.

## Customize

Single-file knobs (the most common edits):

| Want to change | Edit |
|---|---|
| Shiki theme / transformers / language aliases | `app/_mdx/rehype-shiki.mjs` |
| Article colors / spacing / typography | `app/_mdx/article.css` |
| Fonts | `app/_mdx/fonts.ts` |
| Code block chrome (header, copy, expand threshold) | `app/_mdx/code-block.tsx` |
| Mermaid theme | `app/_mdx/mermaid-block.tsx` |
| What components MDX files can use | `app/[...slug]/page.tsx` (extend `components`) |
| Where content lives | `app/[...slug]/page.tsx` (CONTENT_DIR constant) |

The renderer (`app/_mdx/renderer.tsx`) plumbs frontmatter →
`<ArticleLayout>` and rehype plugins into `compileMDX`. It's the only
place to touch to restructure the pipeline itself.

## Reuse in another Next.js project

`app/_mdx/` is designed to be vendorable. Drop it into another project + a
catchall route + a content directory and you have the same experience:

```bash
cp -r article-template/app/_mdx       new-project/app/_mdx
cp -r article-template/app/[...slug]  new-project/app/[...slug]
mkdir -p new-project/content
pnpm add next-mdx-remote rehype-slug \
  @shikijs/rehype @shikijs/transformers shiki \
  unist-util-visit mermaid
```

See `app/_mdx/README.md` for the per-folder details.

## Tradeoffs worth knowing

- **Runtime MDX, not compile-time.** We use `next-mdx-remote/rsc` instead of
  `@next/mdx`. SSG via `generateStaticParams` makes the runtime cost zero —
  every article becomes a static HTML page at build time. The win is no
  per-file boilerplate (no imports / no default export).
- **TOC is client-side.** Scans the DOM after mount instead of pre-extracting
  at build. Simple + decoupled, costs a one-frame FOUC.
- **Components are whitelisted.** Since MDX files have no imports in the
  runtime model, any component an article wants to use must be registered in
  `app/[...slug]/page.tsx`. This is a feature for safety + a friction tax for
  one-off components.
- **Mermaid loads ~2MB on first diagram.** Dynamic-imported per-page, so
  articles without diagrams stay light.
- **Light mode only.** Dark-mode CSS exists but no toggle is wired up — drop
  in `next-themes` or your own theme switcher and the existing
  `[data-theme="dark"]` selectors take over.
