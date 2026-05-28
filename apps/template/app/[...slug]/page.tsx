import { createMdxRoute } from "prose-atelier/route";

import * as demos from "@/app/_demos";

/* Catchall MDX route. The package walks `content/` at build time and
   statically generates one page per .mdx file. Project-specific demo
   components are injected so MDX files can reference them by name. */

const route = createMdxRoute({ components: demos });

export default route.Page;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
/* Must be a literal — Next.js statically parses route segment config
   from this file. See prose-atelier/route source for context. */
export const dynamicParams = false;
