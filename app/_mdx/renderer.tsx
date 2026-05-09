import type { ReactNode } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";

import { ArticleLayout, type ArticleMeta } from "./article-layout";
import { articleMdxComponents } from "./components";
import { CodeBlock } from "./code-block";
import { MermaidBlock } from "./mermaid-block";
import rehypeShiki from "./rehype-shiki.mjs";
import rehypeAddCopyContent from "./rehype-add-copy-content.mjs";
import rehypeCustomBlocks from "./rehype-custom-blocks.mjs";

/* MDXArticle is the single entry point for rendering an article from
   raw MDX source. To customize: edit this file (it's the only config
   point). To extend with project-specific React components an article
   can use, pass them via `components`. */

export type MDXArticleProps = {
  source: string;
  /* Extra MDX components — merged in after the built-ins so callers
     can shadow defaults (e.g. swap Demo). `any` props because each
     project's components have their own prop shapes. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: Record<string, React.ComponentType<any>>;
  /* Override the layout entirely (e.g. for a non-article page that
     just wants the same MDX pipeline). Defaults to ArticleLayout. */
  layout?: (props: { meta: ArticleMeta; children: ReactNode }) => ReactNode;
};

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
          // for both the raw text (data-content) and the language id
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
