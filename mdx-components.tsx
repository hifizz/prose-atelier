import type { MDXComponents } from "mdx/types";
import { articleMdxComponents } from "@/app/_article/components";
import { CodeBlock } from "@/app/_codeblock";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    ...articleMdxComponents,
    pre: CodeBlock,
  };
}
