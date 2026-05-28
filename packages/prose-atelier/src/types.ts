/* =============================================================================
 *  prose-atelier — Canonical Type Surface
 * =============================================================================
 *
 *  This file is the **single source of truth** for every public type the
 *  package exposes. Component files import their types from here; barrel
 *  files (index.ts / core.ts / route.tsx) re-export from here.
 *
 *  Why centralize:
 *  - A type like `ArticleMeta` is consumed by 3+ modules (ArticleLayoutBase,
 *    MDXArticle, createMdxRoute). It's not "the layout's type" — it's a
 *    data contract. Data contracts need a stable home.
 *  - Centralizing prevents the "import cycles via component file" trap
 *    where component A imports a type from component B's file just because
 *    B happened to define it.
 *
 *  Organization (top-down by dependency):
 *  ┌─ §1  Theme / density enums          (atomic value types)
 *  ├─ §2  ArticleMeta                    (frontmatter shape — central data)
 *  ├─ §3  ArticleLinkProps               (link injection contract)
 *  ├─ §4  Component prop types           (ArticleLayoutBase / Demo / etc.)
 *  ├─ §5  MDXComponentMap                (MDX element override map)
 *  ├─ §6  MDXArticleProps                (Next.js renderer entry)
 *  └─ §7  CreateMdxRouteOptions          (Next.js route helper config)
 *
 *  Module relationships at a glance:
 *
 *      ┌──────────────────────────────────────────────────────────┐
 *      │  types.ts  (this file — no runtime, no React imports)    │
 *      └──────────────────────────────────────────────────────────┘
 *           ▲                          ▲                  ▲
 *           │                          │                  │
 *      consumed by                consumed by         consumed by
 *           │                          │                  │
 *      article-layout-base.tsx    renderer.tsx        route.tsx
 *      code-block.tsx             (Next-only)         (Next-only)
 *      mermaid-block.tsx
 *      article-toc.tsx
 *      density-tabs.tsx
 *      components.tsx
 *
 *  Re-export path (so consumers don't dig into /types):
 *
 *      core.ts   → re-exports §1-§5 (framework-agnostic types)
 *      index.ts  → re-exports §1-§7 (everything, Next-flavored bundle)
 *      route.tsx → re-exports §7   (route-config-specific)
 *
 *  None of these types reference `next/*`. Next-specific concerns (e.g. the
 *  shape of next/link's props) are deliberately abstracted via
 *  `ArticleLinkProps` so this file stays portable.
 * ============================================================================= */

import type { ComponentType, ReactNode } from "react";
import type { MDXComponents } from "mdx/types";

/* ============================================================================
 *  §1  Theme / density enums
 *
 *  Atomic value-types. They appear inside `ArticleMeta` (§2) and gate which
 *  visual branch `ArticleLayoutBase` renders. Adding a value here is a
 *  cross-cutting change — it requires:
 *    - a new branch in article-layout-base.tsx
 *    - a new CSS file (or new top-level class block)
 *    - a docs entry in README "Themes" section
 * ============================================================================ */

/**
 * Visual style of the article. Picked via `ArticleMeta.theme` (§2). Each
 * value maps to one CSS file + one branch in `ArticleLayoutBase`:
 *
 *   - `editorial` — magazine layout, fixed left-rail TOC, h2-as-divider,
 *      serif italic <em>. CSS: article.css. Default.
 *   - `notebook`  — single-column tech-blog feel, inline h2s, dashed-
 *      underline <em> (CJK-friendly), no TOC. CSS: article-notebook.css.
 *   - `chat`      — tuned for AI-coding-tool reply content (dense lists,
 *      mixed code blocks, tool outputs, CJK-friendly). Pairs with
 *      `ArticleDensity` (§1). CSS: article-chat.css.
 */
export type ArticleTheme = "editorial" | "notebook" | "chat";

/**
 * Body-size scale, only meaningful for `theme: "chat"`. Maps to
 * `data-density="..."` on the chat-theme container; the chat CSS keys
 * font-size / line-height / spacing tokens off this attribute.
 *
 *   - `xs` — 12px body, very compact (skim mode)
 *   - `sm` — 14px body, normal-tight
 *   - `md` — 16px body, default for AI replies
 *   - `lg` — 18px body, large / accessibility
 *
 * Live preview is exposed at runtime via `<DensityTabs />` (a client
 * component that toggles `[data-density]` on the nearest .art-chat root).
 */
export type ArticleDensity = "xs" | "sm" | "md" | "lg";

/* ============================================================================
 *  §2  ArticleMeta — the central data contract
 *
 *  This is the shape that flows from .mdx frontmatter all the way to the
 *  layout component. The hops:
 *
 *    .mdx file ──► next-mdx-remote (parseFrontmatter)
 *                 ──► MDXArticle (renderer.tsx)
 *                 ──► ArticleLayout / ArticleLayoutBase
 *
 *  Or, for non-Next consumers using an external MDX compiler:
 *
 *    .mdx file ──► @mdx-js/rollup (or similar)
 *                 ──► consumer's page component
 *                 ──► ArticleLayoutBase
 *
 *  Adding a field here ripples to:
 *    - frontmatter parsing (no change — YAML is structural)
 *    - article-layout-base.tsx (must read it)
 *    - all three CSS files (if it affects styling)
 *    - README "Frontmatter reference" table
 * ============================================================================ */

/**
 * Article metadata, parsed from the MDX file's YAML frontmatter. Only
 * `title` is required; everything else has sensible defaults applied
 * inside `ArticleLayoutBase`.
 */
export type ArticleMeta = {
  /** Page H1 + browser tab title source. */
  title: string;
  /** Optional date string. Free-form — rendered as-is, not parsed. */
  date?: string;
  /** Sub-headline shown beneath the title. ReactNode so MDX can pass
   *  rich content (links, <em>, etc.). */
  tagline?: ReactNode;
  /** Top-of-page back link. Defaults to `{ href: "/", label: "← back" }`.
   *  Set `back: false` upstream by simply omitting it AND the layout
   *  will still render the default — to truly hide it, override via
   *  CSS or wrap your own layout. (Intentional: the back link is a
   *  shared-template anchor, not configurable away.) */
  back?: { href: string; label?: string };
  /** TOC config. Only consumed by `editorial` theme.
   *    - `undefined` → render TOC with default label
   *    - `{ label }` → render TOC with custom label
   *    - `false`     → suppress TOC even on editorial theme
   *  `notebook` and `chat` themes ignore this field entirely. */
  toc?: { label?: string } | false;
  /** Visual theme. See §1. Defaults to `"editorial"`. */
  theme?: ArticleTheme;
  /** Body-size scale, only honored when `theme === "chat"`. See §1.
   *  Defaults to `"md"`. */
  density?: ArticleDensity;
};

/* ============================================================================
 *  §3  ArticleLinkProps — link injection contract
 *
 *  This is the bridge that lets one ArticleLayoutBase work in any framework.
 *  It defines the *minimum* props any link component must accept. The
 *  default is a plain <a>; Next.js adapter passes next/link; React Router
 *  consumers pass <Link>.
 *
 *  Width principle: include only the props the layout actually uses. Don't
 *  over-specify (e.g. don't add Next-only `prefetch`); don't under-specify
 *  (e.g. must include `aria-label` because the back link needs it).
 * ============================================================================ */

/**
 * Props consumed by the `linkComponent` prop of `ArticleLayoutBase` (§4).
 * Wide enough to be satisfied by:
 *   - plain `<a>`
 *   - `next/link` (which accepts arbitrary anchor props as children/forwarded)
 *   - `react-router`'s `<Link>` (use a small wrapper to map `href` → `to`)
 *   - `@tanstack/react-router`'s `<Link>` (similar wrapper)
 */
export type ArticleLinkProps = {
  href: string;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
};

/* ============================================================================
 *  §4  Component prop types
 *
 *  These are the typed boundaries between consumer code and our components.
 *  Each one names the component it belongs to and lists what hooks into it.
 * ============================================================================ */

/**
 * Props for `ArticleLayoutBase` — the framework-agnostic layout component.
 * Defined in `article-layout-base.tsx`.
 *
 * Consumed by:
 *   - `core.ts` re-exports the component (non-Next users)
 *   - `article-layout.tsx` (Next adapter — wraps and injects next/link)
 *   - `renderer.tsx` (MDXArticle uses ArticleLayout, which forwards to here)
 */
export type ArticleLayoutBaseProps = {
  /** Frontmatter-derived metadata. See §2. */
  meta: ArticleMeta;
  /** The article body (already-compiled MDX content tree). */
  children: ReactNode;
  /** Additional CSS class applied to the outermost wrapper. The Next.js
   *  adapter uses this to inject `next/font` font-variable classes; non-
   *  Next consumers leave it empty and provide fonts via global CSS. */
  fontClass?: string;
  /** Pluggable link component. Defaults to a plain `<a>`. See §3 for
   *  the prop contract. */
  linkComponent?: ComponentType<ArticleLinkProps>;
};

/**
 * Props for `Demo` — a framed visual demo with optional caption.
 * Defined in `components.tsx`. Used inside MDX content via the
 * `articleMdxComponents` map (§5) or imported directly from `/core`.
 */
export type DemoProps = {
  theme?: "dark" | "light";
  caption?: ReactNode;
  tag?: ReactNode;
  children: ReactNode;
};

/** Props for `DemoFrame` — the chrome-only wrapper used by `Demo`. */
export type DemoFrameProps = {
  theme?: "dark" | "light";
  children: ReactNode;
};

/** Props for `DemoCaption` — the caption-only piece used by `Demo`. */
export type DemoCaptionProps = {
  tag?: ReactNode;
  children: ReactNode;
};

/**
 * Props for `ArticleToc` — the editorial-theme left-rail TOC. Defined in
 * `article-toc.tsx`. Reads h2 `id`s from the rendered DOM (set by
 * `rehype-slug`), so it must run client-side after the article paints.
 */
export type ArticleTocProps = {
  /** Header text above the TOC list. Defaults internally. */
  label?: string;
};

/* ============================================================================
 *  §5  MDXComponentMap — MDX element override map
 *
 *  When the renderer compiles MDX, it passes a `components` map that lets
 *  you override the React component used for each tag (`h1`, `pre`,
 *  `Demo`, etc.). We export `articleMdxComponents` (a default map) and
 *  this type so consumers can compose their own.
 * ============================================================================ */

/**
 * Map of MDX element name → React component. Same shape as MDX's own
 * `MDXComponents` type, re-exported here so consumers don't need a direct
 * dependency on `mdx/types`.
 *
 * Owned by: `components.tsx` (the `articleMdxComponents` constant).
 * Consumed by:
 *   - `MDXArticle` (renderer.tsx) — merged with caller-supplied components.
 *   - Non-Next consumers passing this directly to `<Article components={...} />`
 *     where Article is their MDX-compiled module.
 */
export type MDXComponentMap = MDXComponents;

/* ============================================================================
 *  §6  MDXArticleProps — Next.js MDX renderer entry
 *
 *  Server-component props. Lives in renderer.tsx, only callable in a Next.js
 *  RSC environment because `next-mdx-remote/rsc` is RSC-only.
 * ============================================================================ */

/**
 * Props for `MDXArticle` (renderer.tsx) — the Next.js-only top-level
 * renderer. Reads MDX source string, runs the rehype/remark pipeline, and
 * hands the result to `ArticleLayout`.
 *
 * Why `components` is `Record<string, ComponentType<any>>` instead of
 * `MDXComponentMap`: each project's components have their own prop shapes;
 * forcing a strict map would require generic plumbing that nobody benefits
 * from at runtime. The `any` is intentional and scoped.
 */
export type MDXArticleProps = {
  /** Raw MDX source text (file contents, including frontmatter). */
  source: string;
  /** Extra MDX components — merged AFTER the built-ins so callers can
   *  shadow defaults (e.g. swap `Demo` for a project-specific version). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: Record<string, ComponentType<any>>;
  /** Override the layout entirely — useful for special pages that want
   *  the same MDX pipeline but a non-article shell. Defaults to the
   *  package's `ArticleLayout`. */
  layout?: (props: { meta: ArticleMeta; children: ReactNode }) => ReactNode;
};

/* ============================================================================
 *  §7  CreateMdxRouteOptions — Next.js catchall route helper config
 *
 *  Lives in route.tsx. Wraps fs.readdir + generateStaticParams + the
 *  default Page component into a single factory the consumer re-exports
 *  from `app/[...slug]/page.tsx`.
 * ============================================================================ */

/**
 * Configuration for `createMdxRoute(opts)` (route.tsx). Consumed only by
 * Next.js applications.
 *
 * Resolution rules:
 *   - `contentDir` is resolved relative to `process.cwd()` — i.e. the Next
 *     app's project root. Default: `"content"`.
 *   - `components` are forwarded straight to `MDXArticleProps.components`
 *     (§6) for every page in the route.
 */
export type CreateMdxRouteOptions = {
  /** Directory to scan for `.mdx` files. Defaults to `"content"`,
   *  resolved against `process.cwd()`. */
  contentDir?: string;
  /** Project-specific React components, made available by name to every
   *  MDX file rendered through this route. */
  components?: MDXArticleProps["components"];
};

/**
 * Return shape of `createMdxRoute(opts)`. The three properties match the
 * Next.js App Router conventions a `page.tsx` file is expected to export.
 *
 * Pattern of use:
 *
 *   // app/[...slug]/page.tsx
 *   const route = createMdxRoute({ components });
 *   export default route.Page;
 *   export const { generateStaticParams, dynamicParams } = route;
 */
export type CreateMdxRouteReturn = {
  /** Next.js App Router page component. Async — reads MDX from disk
   *  using the slug params and renders it via `MDXArticle`. */
  Page: (props: {
    params: Promise<{ slug: string[] }>;
  }) => Promise<ReactNode>;
  /** SSG enumerator. Walks `contentDir` and emits one entry per .mdx. */
  generateStaticParams: () => Promise<{ slug: string[] }[]>;
  /** Always `false` — slugs not present at build time should 404, not
   *  attempt dynamic rendering (which would trigger fs reads at runtime
   *  on potentially attacker-controlled paths). */
  dynamicParams: false;
};
