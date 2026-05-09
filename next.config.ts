import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
};

const withMDX = createMDX({
  options: {
    // Plugins are passed as string specifiers so Turbopack can serialize the
    // loader options. Plugin packages must be installed as dependencies.
    remarkPlugins: [
      "remark-frontmatter",
      ["remark-mdx-frontmatter", { name: "meta" }],
    ],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
