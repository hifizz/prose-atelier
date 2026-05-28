/* Framework-agnostic entry — no `next/*` imports anywhere on this path.

   CI invariant (see DESIGN.md §3.3): a grep for "next/" or "next-mdx-remote"
   over dist/core*.js + dist/article-layout-base*.js must come back empty.

   For Next.js consumers, prefer the top-level entry "prose-atelier". */

export { ArticleLayoutBase } from "./article-layout-base";
export { ArticleToc } from "./article-toc";
export { CodeBlock } from "./code-block";
export { MermaidBlock } from "./mermaid-block";
export { DensityTabs } from "./density-tabs";
export {
  Demo,
  DemoFrame,
  DemoCaption,
  articleMdxComponents,
} from "./components";

export type {
  ArticleMeta,
  ArticleTheme,
  ArticleDensity,
  ArticleLinkProps,
  ArticleLayoutBaseProps,
  ArticleTocProps,
  DemoProps,
  DemoFrameProps,
  DemoCaptionProps,
  MDXComponentMap,
} from "./types";
