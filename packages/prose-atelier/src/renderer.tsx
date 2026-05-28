import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { ArticleLayout } from "./article-layout";
import { articleMdxComponents } from "./components";
import { CodeBlock } from "./code-block";
import { MermaidBlock } from "./mermaid-block";
import rehypeShiki from "./rehype-shiki.mjs";
import rehypeAddCopyContent from "./rehype-add-copy-content.mjs";
import rehypeCustomBlocks from "./rehype-custom-blocks.mjs";
import type { ArticleMeta, MDXArticleProps } from "./types";

/* MDXArticle — Next.js-only top-level renderer. Compiles a raw MDX
   source string at request time (or at build time, depending on Next's
   route config) and hands the result to ArticleLayout.

   See src/types.ts §6 (MDXArticleProps) for the prop contract.

   Why next-mdx-remote/rsc and not @mdx-js/mdx directly: this gives us
   automatic frontmatter parsing (via `parseFrontmatter`) and RSC-aware
   compilation that interleaves with the rest of the App Router page tree
   correctly. The cost: this module only works in a Next.js RSC env. */

export async function MDXArticle({
  source,
  components,
  layout,
}: MDXArticleProps) {
  const { content, frontmatter } = await compileMDX<ArticleMeta>({
    source,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        // Functions are fine here — runtime MDX, no Turbopack
        // serialization constraint to worry about.
        remarkPlugins: [
          // GFM enables tables, task lists, strikethrough, autolinks —
          // all common in AI-tool reply content.
          remarkGfm,
        ],
        rehypePlugins: [
          rehypeSlug,
          // rehypeCustomBlocks must run BEFORE Shiki — it routes
          // ```mermaid blocks to <MermaidBlock> so Shiki doesn't try
          // to syntax-highlight diagram source.
          rehypeCustomBlocks,
          rehypeShiki,
          // rehypeAddCopyContent must run AFTER Shiki — Shiki rebuilds
          // the <pre><code> subtree and would drop properties added
          // earlier. Running last lets us walk Shiki's tokenized tree
          // for both the raw text (data-content) and language id
          // (data-lang).
          rehypeAddCopyContent,
        ],
      },
    },
    components: {
      ...articleMdxComponents,
      pre: CodeBlock,
      MermaidBlock,
      ...(components ?? {}),
    },
  });

  const meta = (frontmatter ?? {}) as ArticleMeta;
  const Layout = layout ?? ArticleLayout;
  return <Layout meta={meta}>{content}</Layout>;
}
