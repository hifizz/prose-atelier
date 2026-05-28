import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MDXArticle } from "./renderer";
import type { CreateMdxRouteOptions, CreateMdxRouteReturn } from "./types";

/* createMdxRoute — Next.js catchall route helper.

   Wraps fs.readdir + generateStaticParams + the page component into a
   factory the consumer re-exports from app/[...slug]/page.tsx. See
   src/types.ts §7 (CreateMdxRouteOptions / CreateMdxRouteReturn) for
   the contract.

   Default export at the bottom enables the zero-config one-line form:
     export { default, generateStaticParams, dynamicParams } from "prose-atelier/route";
*/

type Params = { slug: string[] };

async function listMdxSlugs(
  dir: string,
  prefix: string[] = []
): Promise<string[][]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[][] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sub = await listMdxSlugs(path.join(dir, entry.name), [
        ...prefix,
        entry.name,
      ]);
      out.push(...sub);
    } else if (entry.name.endsWith(".mdx")) {
      out.push([...prefix, entry.name.replace(/\.mdx$/, "")]);
    }
  }
  return out;
}

async function readSourceFrom(
  rootDir: string,
  slug: string[]
): Promise<string | null> {
  const file = path.join(rootDir, ...slug) + ".mdx";
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return null;
  }
}

/* Build the cheap-frontmatter-title peek. Avoids running the whole MDX
   pipeline twice for generateMetadata. Intentionally simple — for any
   richer metadata logic the consumer should wrap their own
   `generateMetadata` instead of using ours. */
function peekTitle(source: string): string | null {
  const m = source.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const titleMatch = m[1].match(/^title:\s*(.+)$/m);
  if (!titleMatch) return null;
  return titleMatch[1].replace(/^['"]|['"]$/g, "").trim() || null;
}

export function createMdxRoute(
  opts: CreateMdxRouteOptions = {}
): CreateMdxRouteReturn & {
  generateMetadata: (args: {
    params: Promise<Params>;
  }) => Promise<Metadata>;
} {
  const rootDir = path.join(process.cwd(), opts.contentDir ?? "content");
  const components = opts.components;

  async function generateStaticParams() {
    const slugs = await listMdxSlugs(rootDir);
    return slugs.map((slug) => ({ slug }));
  }

  async function generateMetadata({
    params,
  }: {
    params: Promise<Params>;
  }): Promise<Metadata> {
    const { slug } = await params;
    const source = await readSourceFrom(rootDir, slug);
    if (!source) return {};
    const title = peekTitle(source);
    return title ? { title } : {};
  }

  async function Page({ params }: { params: Promise<Params> }) {
    const { slug } = await params;
    const source = await readSourceFrom(rootDir, slug);
    if (source == null) notFound();
    return <MDXArticle source={source} components={components} />;
  }

  return {
    Page,
    generateStaticParams,
    generateMetadata,
    dynamicParams: false as const,
  };
}

/* Zero-config defaults — enable:
     export { default, generateStaticParams, dynamicParams } from "prose-atelier/route";

   `dynamicParams` is a literal `false` (not `_default.dynamicParams`)
   because Next.js / Turbopack statically parses route segment config
   from the importing page file, and forwarded expressions fail that
   parse. Same constraint applies to consumers using `createMdxRoute`:
   they must write `export const dynamicParams = false;` as a literal
   in their page.tsx — see README "Frontmatter reference" section. */
const _default = createMdxRoute();
export default _default.Page;
export const generateStaticParams = _default.generateStaticParams;
export const generateMetadata = _default.generateMetadata;
export const dynamicParams = false;

export type { CreateMdxRouteOptions, CreateMdxRouteReturn } from "./types";
