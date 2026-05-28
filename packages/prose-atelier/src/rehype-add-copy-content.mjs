/**
 *  Walks the hast tree before Shiki rewrites <code> to token spans, and
 *  hoists two pieces of info from the inner <code> onto the outer <pre>:
 *
 *    - `data-content` — original source text (for the Copy button)
 *    - `data-lang`    — language id (for the header label)
 *
 *  Both are needed because the CodeBlock React component overrides `pre`
 *  in MDX components, and from there can only see the <pre>'s own props,
 *  not the children's className/text.
 *
 *  Plugin order matters — register this BEFORE rehype-shiki in
 *  renderer.tsx so we capture the text + language before tokenization.
 */

import { visit } from "unist-util-visit";

export default function rehypeAddCopyContent() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "pre") return;
      const code = node.children?.find(
        (c) => c.type === "element" && c.tagName === "code"
      );
      if (!code) return;

      node.properties = node.properties || {};

      const text = extractText(code);
      if (text) node.properties.dataContent = text;

      // After Shiki, the language class lives on `code.properties.class` (not
      // `className` — Shiki's hast uses raw HTML attribute names).
      const lang = extractLanguage(
        code.properties?.className ?? code.properties?.class
      );
      if (lang) node.properties.dataLang = lang;
    });
  };
}

function extractText(node) {
  if (!node) return "";
  if (node.type === "text") return node.value || "";
  if (Array.isArray(node.children)) {
    return node.children.map(extractText).join("");
  }
  return "";
}

/* className in HAST can be either an array (e.g. ["language-tsx", "shiki"])
   or a string ("language-tsx shiki"). Handle both. */
function extractLanguage(className) {
  if (!className) return null;
  const tokens = Array.isArray(className)
    ? className
    : typeof className === "string"
      ? className.split(/\s+/)
      : [];
  for (const t of tokens) {
    if (typeof t !== "string") continue;
    if (t.startsWith("language-")) return t.slice("language-".length);
  }
  return null;
}
