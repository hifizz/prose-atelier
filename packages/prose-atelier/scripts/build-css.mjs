#!/usr/bin/env node
/* Concatenates the 5 source CSS files into a single dist/styles.css.
   Order matters: article.css defines the base .art-root rules and
   shared variables; theme overrides (notebook, chat) come after; then
   the orthogonal block styles (code, mermaid).

   This is a deliberate, dumb cat — no postcss, no nesting unwrap, no
   minification. The source CSS is already plain, framework-agnostic
   CSS3 and that's what we want consumers to receive. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const ORDER = [
  "src/styles/article.css",
  "src/styles/article-notebook.css",
  "src/styles/article-chat.css",
  "src/styles/code-block.css",
  "src/styles/mermaid-block.css",
];

const out = resolve(repoRoot, "dist/styles.css");

const banner = `/* prose-atelier — bundled styles
 * Generated from src/styles/*.css. Do not edit dist/ directly.
 * See DESIGN.md for the CSS variable reference. */
`;

const parts = [banner];
for (const rel of ORDER) {
  const src = resolve(repoRoot, rel);
  const text = await readFile(src, "utf-8");
  parts.push(`/* ─── ${rel} ─── */`);
  parts.push(text.trimEnd());
  parts.push("");
}

await mkdir(dirname(out), { recursive: true });
await writeFile(out, parts.join("\n"), "utf-8");
console.log(`built ${out} (${parts.length - 1} sources)`);
