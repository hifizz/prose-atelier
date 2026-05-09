# article-template

An MDX-driven editorial article template. Editorial muted typography, a fixed
left-rail TOC that auto-tracks the visible section, and a `<Demo>` primitive
for embedding interactive React components inside the prose.

Originally extracted from
[playground.zilin.im](https://github.com/zilin/playground.zilin.im) and
inspired by the typography of
[benji.org/liveline](https://benji.org/liveline).

## Quick start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3090 — the index links to `/example`, which is itself a
single `app/example/page.mdx` file demonstrating every primitive.

## Add an article

Create `app/<slug>/page.mdx`:

```mdx
---
title: My article
date: 9 May, 2026
---

import { ArticleLayout, Demo } from "@/app/_article";
import { MyDemo } from "./demos";

export const tagline = <>One sentence subtitle.</>;
export default ({ children }) => (
  <ArticleLayout meta={{ ...meta, tagline }}>{children}</ArticleLayout>
);

Body prose...

## A section heading

<Demo theme="dark" caption={<>Caption text.</>} tag="optional-tag">
  <MyDemo />
</Demo>
```

If the article has interactive bits, put them in a sibling `app/<slug>/demos.tsx`
marked `"use client"`.

## What's in the template

```
app/_article/
├── article.css          design tokens + typography + TOC sidebar styles
├── fonts.ts             Inter (sans) + Newsreader (italic serif)
├── article-layout.tsx   server component: shell + header + TOC + main
├── article-toc.tsx      client component: IntersectionObserver-based TOC
├── components.tsx       Demo / DemoFrame / DemoCaption + MDX overrides
└── index.ts             public exports
```

The `mdx-components.tsx` at the project root wires the MDX overrides
(`h2` → section divider, `hr` → dotted divider). They depend on `rehype-slug`
auto-generating heading IDs (configured in `next.config.ts`).

Customize tokens in `app/_article/article.css` — every color and spacing value
is a `--art-*` CSS variable on `.art-root`.

## What it intentionally does NOT include

- **Syntax highlighting.** Plain `<pre>` blocks inherit the muted cream style.
  Add Shiki / Prism / starry-night yourself if you want highlighting — slot the
  rehype plugin into `next.config.ts` next to `rehype-slug`.
- **Dark mode.** The template is light-mode only. Demo frames have a `theme="dark"`
  prop for the card-on-page contrast (mimicking dashboard chips on an editorial
  page), but the page itself stays light.
- **Tailwind.** Pure CSS Module-style scoped class names (`.art-*`).
- **A CMS / blog index page.** This is a *template*, not a blog engine. If you
  want an index, write one — each `page.mdx` is just a Next.js route.

## Tradeoffs worth knowing

- **TOC is client-side.** The TOC component scans the DOM after mount instead
  of pre-extracting headings at build time. This keeps the template simple and
  decoupled from the MDX pipeline. The cost: a one-frame FOUC where the sidebar
  is empty, then populates. If you prefer a build-time TOC, you can write a
  custom rehype plugin that exports headings as a named export from each MDX
  file and consume that in `<ArticleLayout>` — search "rehype toc" for prior
  art.
- **Plugins as strings, not imports, in `next.config.ts`.** Required by
  Turbopack (the default in Next 16) — loader options must be serializable.
  This is why `next.config.ts` doesn't import plugin functions directly.
- **Fonts via `next/font/google`.** Switch to local fonts by editing
  `app/_article/fonts.ts`. The CSS variables `--font-article-sans` and
  `--font-article-serif` are what `article.css` consumes.
