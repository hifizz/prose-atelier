#!/usr/bin/env node
/* Copies the 3 rehype plugin files src/rehype-*.mjs → dist/rehype-*.mjs.
   bunchee handles JS/TS but these are intentionally plain ESM .mjs that
   any unified pipeline can consume without our compile step. We just
   pass them through unchanged. */
import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const srcDir = resolve(repoRoot, "src");
const distDir = resolve(repoRoot, "dist");

await mkdir(distDir, { recursive: true });

const entries = await readdir(srcDir);
let copied = 0;
for (const entry of entries) {
  if (!/^rehype-.*\.mjs$/.test(entry)) continue;
  await copyFile(resolve(srcDir, entry), resolve(distDir, entry));
  copied++;
  console.log(`copied src/${entry} → dist/${entry}`);
}
console.log(`copied ${copied} rehype plugin file(s)`);
