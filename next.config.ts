import type { NextConfig } from "next";
import path from "node:path";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
};

/* @next/mdx resolves plugin string paths relative to each MDX file's
   directory, not the project root, so a relative path like "./app/foo"
   would only work for MDX files in the project root. Absolute path
   computed at config load time sidesteps that. */
const codeblockPlugin = path.resolve(
  process.cwd(),
  "app/_codeblock/rehype-shiki.mjs"
);

const withMDX = createMDX({
  options: {
    // Plugins are passed as string specifiers so Turbopack can serialize
    // the loader options. Package names work; absolute paths work too.
    remarkPlugins: [
      "remark-frontmatter",
      ["remark-mdx-frontmatter", { name: "meta" }],
    ],
    rehypePlugins: [
      "rehype-slug",
      // Pre-configured Shiki — see app/_codeblock/rehype-shiki.mjs.
      codeblockPlugin,
    ],
  },
});

export default withMDX(nextConfig);
