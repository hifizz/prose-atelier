import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MDXArticle } from "@/app/_mdx";
import * as demos from "@/app/_demos";

/* Catchall route. Walks content/ at build time, statically generates
   one page per .mdx file. Drop content/foo.mdx, get /foo. Subdirectories
   work too — content/series/part-1.mdx → /series/part-1.

   Demo components from app/_demos are merged in so MDX files can
   reference them by name (e.g. <TickingDot />) without imports. */

const CONTENT_DIR = path.join(process.cwd(), "content");

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

async function readSource(slug: string[]): Promise<string | null> {
  const file = path.join(CONTENT_DIR, ...slug) + ".mdx";
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const slugs = await listMdxSlugs(CONTENT_DIR);
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const source = await readSource(slug);
  if (!source) return {};
  // Cheap frontmatter peek — avoids running the whole MDX pipeline twice.
  const m = source.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const titleMatch = m[1].match(/^title:\s*(.+)$/m);
  const title = titleMatch?.[1].replace(/^['"]|['"]$/g, "").trim();
  return title ? { title } : {};
}

export default async function ContentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const source = await readSource(slug);
  if (source == null) notFound();

  return <MDXArticle source={source} components={demos} />;
}
