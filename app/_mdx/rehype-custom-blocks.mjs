/**
 *  Routes special fenced blocks to React components instead of the
 *  default Shiki-tokenized <pre><code>. Currently:
 *
 *      ```mermaid    →  <MermaidBlock source="..."/>
 *
 *  Add more by extending the SPECIAL map. The replacement must match
 *  a name registered in `components` in renderer.tsx.
 *
 *  Plugin order matters — register this BEFORE rehype-shiki so Shiki
 *  doesn't try to syntax-highlight the source we're handing off.
 */

import { visit, SKIP } from "unist-util-visit";

const SPECIAL = {
  mermaid: "MermaidBlock",
};

export default function rehypeCustomBlocks() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || node.tagName !== "pre" || index == null) return;

      const code = node.children?.find(
        (c) => c.type === "element" && c.tagName === "code"
      );
      if (!code) return;

      const classes = code.properties?.className;
      const lang = Array.isArray(classes)
        ? classes
            .find(
              (c) => typeof c === "string" && c.startsWith("language-")
            )
            ?.replace(/^language-/, "")
        : null;
      if (!lang) return;

      const ComponentName = SPECIAL[lang];
      if (!ComponentName) return;

      const source = extractText(code);

      parent.children[index] = {
        type: "mdxJsxFlowElement",
        name: ComponentName,
        attributes: [
          { type: "mdxJsxAttribute", name: "source", value: source },
        ],
        children: [],
      };

      return [SKIP, index];
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
