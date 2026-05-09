import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* MDX is rendered at runtime by next-mdx-remote inside
     app/_mdx/renderer.tsx — see app/[...slug]/page.tsx for the catchall
     route. No build-time MDX wiring needed. */
};

export default nextConfig;
