/* Top-level entry — Next.js-flavored bundle.
   Non-Next consumers should import from "prose-atelier/core" instead.
   See DESIGN.md §3 for the entry-point map. */

export { MDXArticle } from "./renderer";
export { ArticleLayout } from "./article-layout";
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
  MDXArticleProps,
} from "./types";
