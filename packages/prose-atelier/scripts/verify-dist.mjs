#!/usr/bin/env node
/* Verifies the built dist/ matches the design invariants in DESIGN.md §3.3.

   Checks:
   1. All declared exports exist on disk.
   2. /core path has no `next/` or `next-mdx-remote` references.
   3. Client components retain "use client" directive on first line.
   4. styles.css is non-trivial (> 1KB).
*/
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, "../dist");

const failures = [];

async function exists(rel) {
  try {
    await stat(resolve(dist, rel));
    return true;
  } catch {
    return false;
  }
}

async function read(rel) {
  return readFile(resolve(dist, rel), "utf-8");
}

const REQUIRED = [
  "index.js",
  "index.d.ts",
  "core.js",
  "core.d.ts",
  "route.js",
  "route.d.ts",
  "fonts.js",
  "fonts.d.ts",
  "styles.css",
  "rehype-shiki.mjs",
  "rehype-custom-blocks.mjs",
  "rehype-add-copy-content.mjs",
];

for (const f of REQUIRED) {
  if (!(await exists(f))) failures.push(`missing dist/${f}`);
}

const CORE_FILES = [
  "core.js",
  // bunchee may emit additional chunk files; we'll grep them as a set later
];

for (const f of CORE_FILES) {
  if (!(await exists(f))) continue;
  const text = await read(f);
  if (/from\s+["']next\//.test(text) || /from\s+["']next-mdx-remote/.test(text)) {
    failures.push(
      `dist/${f} contains a Next-only import — /core must stay framework-agnostic`
    );
  }
}

/* bunchee emits client components as hashed chunk files like
   `article-toc-AbCd1234.js`. Match by prefix and verify each retains
   the "use client" directive on the first line. */
const { readdir } = await import("node:fs/promises");
const distFiles = await readdir(dist);
const CLIENT_PREFIXES = ["code-block", "mermaid-block", "article-toc", "density-tabs"];
for (const prefix of CLIENT_PREFIXES) {
  const matches = distFiles.filter(
    (f) => (f === `${prefix}.js` || f.startsWith(`${prefix}-`)) && f.endsWith(".js")
  );
  if (matches.length === 0) {
    failures.push(`no dist/${prefix}*.js chunk found`);
    continue;
  }
  for (const name of matches) {
    const text = await read(name);
    const firstLine = text.split("\n", 1)[0].trim();
    if (!/^["']use client["'];?\s*$/.test(firstLine)) {
      failures.push(
        `dist/${name} first line is not "use client" — got: ${firstLine.slice(0, 60)}`
      );
    }
  }
}

if (await exists("styles.css")) {
  const css = await read("styles.css");
  if (css.length < 1024) failures.push(`dist/styles.css is suspiciously small (${css.length} bytes)`);
}

if (failures.length > 0) {
  console.error("verify FAILED:");
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log("verify OK — all invariants pass");
