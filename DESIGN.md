# Design & implementation

Why article-template is structured the way it is, and the non-obvious
implementation details worth knowing before you change anything.

This is for someone reading the code, not someone using the template.
For usage, see [README.md](./README.md).

## TL;DR

- **Runtime MDX, not compile-time.** `next-mdx-remote/rsc`, not `@next/mdx`.
  All MDX rendering goes through one component: `app/_mdx/renderer.tsx`.
- **Content lives outside `app/`.** `.mdx` files go in `content/`. A
  catchall route at `app/[...slug]/page.tsx` walks the directory and
  SSGs each file at build time. Zero per-file boilerplate.
- **The reusable unit is a folder, not a package.** `app/_mdx/` is
  designed to be vendorable — `cp -r` it into any Next.js project, install
  three peer deps, you're done. No npm publishing dance, no peer-dep
  range maintenance.
- **Components are whitelisted.** MDX files can't `import`, so any React
  component an article wants to use must be registered in
  `app/[...slug]/page.tsx`. This is a feature: it forces a single
  registration point and prevents accidental coupling.

## The big architectural decisions

### 1. Runtime MDX (`next-mdx-remote`) instead of compile-time (`@next/mdx`)

**The compile-time model** would put `app/<slug>/page.mdx` files in the
project tree. Each file becomes a Next.js route. Pros: zero runtime
overhead, MDX files can `import` arbitrary modules. Cons:

- Each article needs ~8 lines of boilerplate (`import { ArticleLayout }`,
  `export default ({children}) => <ArticleLayout meta={...}>...`)
- The MDX file is forced into the `app/` routing convention, which mixes
  authored content with application code.
- Turbopack (Next 16's default bundler) can't serialize plugin functions
  in `next.config.ts`, forcing every Shiki configuration knob to be
  expressed as a string path through a wrapper plugin file. Awkward.

**The runtime model** uses `next-mdx-remote/rsc`'s `compileMDX` inside a
single React component (`<MDXArticle source={...}/>`). Each `content/*.mdx`
file is read at render time, parsed, and rendered. Pros:

- Author writes only frontmatter + Markdown. No imports, no default
  export, no layout wrapping per file.
- Configuration centralizes in one place: `app/_mdx/renderer.tsx`.
- Plugin functions can be imported directly (the Turbopack constraint
  doesn't apply to runtime code).
- Content can live anywhere on disk; the catchall route decides where
  to look.

The "runtime cost" objection is real but irrelevant here: we use Next's
`generateStaticParams` to pre-render every article at build time. Each
page becomes a static HTML file. Same end output as compile-time MDX,
better authoring ergonomics on the way there.

### 2. A vendorable folder, not an npm package

We considered publishing `_mdx/` as `@zilin/article-template` on npm.
Rejected because:

- Shiki, mermaid, Next, and `next-mdx-remote` all evolve independently.
  A published package would need peer-dep ranges that constantly
  drift, plus a build pipeline (tsup or similar), plus CSS distribution
  considerations.
- For ~600 lines of code, that infrastructure is more cost than the
  reuse benefit. Vendoring (literal `cp -r`) gives every consuming
  project full ownership from day one.
- "Drift between projects" is the expected case, not a bug. Each
  project will want different demo components, different colors, maybe
  a different code-block chrome. Vendored copies diverge naturally;
  published packages fight that divergence.

The cost of vendoring: bug fixes don't propagate automatically. You fix
the issue in N projects rather than bumping a version. For this size of
code surface, that's an acceptable trade.

### 3. File-system content (`content/`), not a CMS

The catchall route reads from disk at build time. No database, no fetch,
no remote loader. Each `.mdx` file is text on disk that you can grep,
diff, and version-control alongside the rest of the project.

If you ever need a CMS layer, swap `app/[...slug]/page.tsx`'s
`readSource()` for a fetch — the rest of the pipeline doesn't care
where the source string comes from.

## File-by-file walkthrough of `app/_mdx/`

### `renderer.tsx` — the single configuration point

```tsx
export async function MDXArticle({ source, components, layout }) {
  const { content, frontmatter } = await compileMDX<ArticleMeta>({
    source,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [
          rehypeSlug,
          rehypeCustomBlocks,    // ```mermaid → <MermaidBlock>
          rehypeShiki,            // syntax highlighting
          rehypeAddCopyContent,   // stamp data-content + data-lang
        ],
      },
    },
    components: { ...articleMdxComponents, pre: CodeBlock, MermaidBlock, ...(components ?? {}) },
  });
  const Layout = layout ?? ArticleLayout;
  return <Layout meta={frontmatter}>{content}</Layout>;
}
```

This is the only place where Shiki is configured, where MDX components
get registered, where rehype plugins are ordered. To change the
pipeline, edit this file. Don't add config indirection elsewhere.

### `article-layout.tsx` — the article shell

Server component. Takes parsed frontmatter as `meta`, renders:

- a back link (top-left, fixed)
- the TOC sidebar (left rail, fixed; hidden under 1100px)
- a centered main column (~36rem) with header (date, title, tagline)
  and the rendered MDX as `children`

`meta` shape is documented in README. `meta.toc: false` disables the
TOC entirely.

### `article-toc.tsx` — client-side TOC

A client component that, on mount:

1. Queries `.art-article h2[id]` from the DOM
2. Builds a list of `{ id, text }` entries
3. Sets up an `IntersectionObserver` to track which heading is in view
4. Renders a `<nav>` with anchor links + active-section highlight

**Why client-side instead of build-time?** Two options for build-time:

- A custom rehype plugin that exports headings as a named export from
  the MDX file
- Walk the rendered HAST in `renderer.tsx` and pass headings to
  `ArticleLayout`

Both work but couple the TOC to the MDX pipeline. Client-side scan keeps
`<ArticleToc />` decoupled from how content is loaded — it works
identically whether the article comes from `compileMDX`, hand-written
JSX, or a hypothetical CMS-backed page. Cost: a one-frame FOUC where
the sidebar is empty before mount.

### `code-block.tsx` — code block chrome

Client component that wraps Shiki's `<pre>` output with:

- A header bar showing the language label + copy button
- A body container that auto-collapses if content exceeds 480px scroll
  height, with a center-pinned "Expand" toggle

The actual code coloring is server-rendered by Shiki — this component
just owns the figure.

The component reads two attributes from the wrapped `<pre>`:

- `data-content` — the raw source text, used by the copy button
- `data-lang` — the language id, used by the header label

Both attributes are stamped onto `<pre>` by `rehype-add-copy-content.mjs`.
See ["Plugin order matters"](#plugin-order-matters) below.

### `mermaid-block.tsx` — Mermaid diagrams

Client component. Mermaid is dynamic-imported on first render so projects
without diagrams pay zero kb upfront (the library is ~2 MB minified).
The fenced ` ```mermaid ` block is routed here by
`rehype-custom-blocks.mjs` (see "the special-block routing" below).

### `components.tsx` — MDX element overrides + Demo primitives

Two responsibilities:

- Override default Markdown elements:
  - `h2` → renders as section divider (a horizontal line with the
    heading text inlined on it). The `id` is preserved so TOC anchors
    still work.
  - `hr` → renders as a centered three-dot decoration.
- Export the `<Demo>`, `<DemoFrame>`, `<DemoCaption>` primitives that
  articles can use to embed interactive content in a styled card.

### `rehype-shiki.mjs` — Shiki configuration

Static configuration: vitesse-light + vitesse-dark themes, all 7
transformers (notation diff/focus/highlight, meta line-highlight,
meta word-highlight, notation word-highlight, error-level), language
aliases. To customize Shiki, edit this one file.

### `rehype-custom-blocks.mjs` — special-block routing

Some fenced blocks shouldn't go through Shiki — they need a different
React component. Currently just ` ```mermaid `, but the `SPECIAL` map
at the top is the only thing to extend if you want to add more (e.g.
` ```graphviz `, ` ```math `).

The plugin walks the hast tree, finds `<pre><code class="language-X">`
where `X` is in the map, and replaces the entire `<pre>` with an MDX
JSX element (`<MermaidBlock source="..."/>`).

### `rehype-add-copy-content.mjs` — stamps `data-content` + `data-lang`

After Shiki tokenizes a code block, this plugin walks the result and
copies two pieces of info from the inner `<code>` to the outer `<pre>`:

- The raw source text (concatenated from text nodes) → `data-content`
- The language id (from `language-*` className) → `data-lang`

Both pieces are needed by `<CodeBlock>` (the React `pre` override),
which can only access props on `<pre>` itself, not on its children.

## Pipeline: how an MDX file becomes a page

1. **`pnpm build`** invokes Next's static page generation.
2. `generateStaticParams` (in `app/[...slug]/page.tsx`) walks `content/`
   recursively and returns one `{ slug }` for each `.mdx` file.
3. For each slug, Next calls the page component, which:
   1. Reads the source string from `content/<slug>.mdx`
   2. Hands it to `<MDXArticle>` along with the demo component map
4. `<MDXArticle>` calls `compileMDX` from `next-mdx-remote/rsc`:
   1. Parses the YAML frontmatter (returned as `frontmatter`)
   2. Runs the rehype plugins in order:
      `rehypeSlug` → `rehypeCustomBlocks` → `rehypeShiki` →
      `rehypeAddCopyContent`
   3. Compiles the body to React nodes (returned as `content`)
5. `<MDXArticle>` wraps `content` in `<ArticleLayout meta={frontmatter}>`.
6. Next renders the result to a static HTML file.

At this point the page is just HTML. Hydration kicks in client-side for
interactive bits (`<ArticleToc>`, `<CodeBlock>`, `<MermaidBlock>`,
demo components).

## Plugin order matters

Two findings worth knowing, encoded as comments in the plugins:

### 1. `rehype-add-copy-content` runs AFTER Shiki

Originally we ran it before, hoping to capture the raw source text
before tokenization. But Shiki **rebuilds the entire `<pre><code>` subtree**
in its rehype pass — properties stamped earlier are dropped. So we
have to run after Shiki and walk Shiki's tokenized output (concatenating
text from token spans, not from the original code element).

This matters in two ways:

- We can still recover the raw source via `extractText` because Shiki
  preserves token text content. The text walker is a recursive
  reduce-children-to-text helper.
- We need to extract the language id from the `<code>` element's
  className, but Shiki preserves the original `language-X` class on the
  `<code>` (just adds tokenized children inside it).

### 2. Shiki emits hast properties as `class`, not `className`

The HAST spec uses `properties.className` (an array). Shiki, however,
emits raw HTML attribute names: `properties.class`. Our language
extractor checks both:

```js
const lang = extractLanguage(
  code.properties?.className ?? code.properties?.class
);
```

Without the fallback, `data-lang` would always be empty. Subtle bug.

## Component whitelist (the runtime trade-off)

In compile-time MDX, an article can `import { Whatever } from "..."`
to pull in any React component. In runtime MDX, that doesn't work —
the source is just a string at render time, not a module the bundler
sees.

Our solution: any component an article wants to use by name must be
registered in `app/[...slug]/page.tsx`'s `<MDXArticle components={...}>`
prop. We use the convention `import * as demos from "@/app/_demos"`,
so dropping a component into `app/_demos/index.tsx` makes it available
to every `.mdx` file.

This is a feature, not a bug:

- It forces a single registration point — no surprise dependencies hiding
  in random article files.
- It separates "things the project lets articles use" from "implementation
  detail of one article" cleanly.
- It prevents an article from accidentally pulling in a heavy module
  by `import` and ballooning the bundle.

## CSS scoping

Everything article-related is scoped under `.art-root` (the wrapper
`<div>` rendered by `ArticleLayout`). `.art-*` classes live there. The
font CSS variables (`--font-article-sans`, `--font-article-serif`) are
attached to the same `.art-root` so the typography only applies inside
the article.

`.cb-*` classes (code block chrome) and `.mermaid-block` aren't scoped —
they assume they're inside `.art-root` for the surrounding cascade but
their own selectors don't require it. This means you can theoretically
use `<CodeBlock>` outside an article, but the current CSS file makes
that work-in-progress (e.g. dark mode selectors assume an
`html.dark` or `[data-theme="dark"]` ancestor).

## The two-folder split

```
app/
├── _mdx/      ← generic, vendorable, the reusable unit
└── _demos/    ← project-specific, never copied between projects
```

This split is intentional. `_mdx/` is the same in every project that
adopts the template. `_demos/` is uniquely yours: this project's
`<TickingDot>` is meaningless to a different project.

The integration seam is `app/[...slug]/page.tsx`:

```tsx
import { MDXArticle } from "@/app/_mdx";
import * as demos from "@/app/_demos";
// ...
return <MDXArticle source={source} components={demos} />;
```

When you vendor `_mdx/` into a new project, you drop in your own
`_demos/` and the catchall route keeps working unchanged.

## Tradeoffs we explicitly accept

- **TOC has a one-frame FOUC.** Client-side DOM scan, see above.
- **Mermaid is ~2 MB.** Dynamic-imported, so articles without diagrams
  don't pay it. First diagram on a page costs a flash + load.
- **Light mode only.** Dark-mode CSS exists in `code-block.css` and
  `article.css`, but no theme switcher is wired up. Drop in `next-themes`
  + a toggle and the existing `[data-theme="dark"]` selectors take over.
- **Components are whitelisted.** Discussed above. Friction tax in
  exchange for a single registration point.
- **No syntax highlighter is "perfect."** Shiki uses TextMate grammars.
  Edge cases exist (especially in TSX). It's the de-facto best option;
  if you hit a token coloring bug, that's where to start.
- **`<pre>` wrapping needs `class` AND `className` checks.** See above.
  If you write a similar plugin, account for both.

## Why these aren't features

Things we deliberately did NOT add:

- **Copy button doesn't show "copied!" with an icon.** Just a text
  swap from "copy" to "copied". Quieter, no Lucide / Heroicons dep.
- **Code block doesn't have a "raw" view or download.** YAGNI.
- **No print stylesheet.** YAGNI; if you need it, add a `@media print`
  block to `article.css`.
- **No nested TOC (h2 + h3).** Most editorial articles don't go deep
  enough to need it. h3 is intentionally excluded from the TOC scan.
- **No author / multiple-author metadata.** Editorial template, not a
  blog engine. If you want author bylines, add them to your own
  `<ArticleHeader>` override.

## Where to look when something breaks

| Symptom | First place to look |
|---|---|
| Code block renders but no syntax colors | `app/_mdx/rehype-shiki.mjs` (theme name typo, missing language alias) |
| Mermaid block renders empty | Browser console — Mermaid syntax error logs to console |
| Copy button copies empty string | `app/_mdx/rehype-add-copy-content.mjs` (plugin order: must run AFTER Shiki) |
| Language label is empty | Same plugin — Shiki uses `class` not `className`, the extractor needs to handle both |
| TOC is empty | `app/_mdx/article-toc.tsx` — it queries `.art-article h2[id]`, so check h2s are inside `.art-article` and have IDs (rehype-slug should add them) |
| Page 404s | `app/[...slug]/page.tsx` — `dynamicParams: false` means only files known at build time work; rebuild after adding new content |
| `data-content` missing on `<pre>` | Same as copy button — plugin order |
| Demo component "not defined" error | Not registered in `app/[...slug]/page.tsx` — add to `app/_demos/index.tsx` |
