import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* MDX rendering is delegated to the `prose-atelier` package — see
     app/[...slug]/page.tsx for the catchall route. No build-time MDX
     wiring needed. */
};

export default nextConfig;
