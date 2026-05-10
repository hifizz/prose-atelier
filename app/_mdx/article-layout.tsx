import Link from "next/link";
import type { ReactNode } from "react";

import "./article.css";
import "./article-notebook.css";
import "./article-chat.css";
import "./code-block.css";
import "./mermaid-block.css";
import { articleFontClass } from "./fonts";
import { ArticleToc } from "./article-toc";
import { DensityTabs } from "./density-tabs";

/* The shape of an article's frontmatter, after YAML parsing. Everything
   is optional except `title`. The renderer (renderer.tsx) extracts this
   from the .mdx file and hands it to ArticleLayout as `meta`.

   `theme` picks the visual style:
     - "editorial" (default) — magazine-like, fixed left-rail TOC,
        h2-as-divider, serif italic <em>.
     - "notebook" — single-column tech-blog feel, inline h2s,
        dashed-underline <em> (CJK-friendly), no TOC.
     - "chat" — tuned for AI-coding-tool reply content: dense lists,
        mixed code blocks, tool outputs, CJK-friendly. Pair with
        `density` to pick a body size.

   `density` is the chat theme's 4-step typography scale (see
   article-chat.css for the per-step token values):
     xs — 12px body, very compact (skim mode)
     sm — 14px body, normal-tight
     md — 16px body, default for AI replies   ← fallback
     lg — 18px body, large / accessibility
*/
export type ArticleTheme = "editorial" | "notebook" | "chat";
export type ArticleDensity = "xs" | "sm" | "md" | "lg";

export type ArticleMeta = {
  title: string;
  date?: string;
  tagline?: ReactNode;
  back?: { href: string; label?: string };
  toc?: { label?: string } | false;
  theme?: ArticleTheme;
  /* Only meaningful for theme: "chat". Defaults to "md". */
  density?: ArticleDensity;
};

export function ArticleLayout({
  meta,
  children,
}: {
  meta: ArticleMeta;
  children: ReactNode;
}) {
  const back = meta.back ?? { href: "/", label: "← back" };
  const theme: ArticleTheme = meta.theme ?? "editorial";
  // Notebook + chat are single-column by design — no TOC.
  const tocCfg =
    theme === "notebook" || theme === "chat" || meta.toc === false
      ? null
      : (meta.toc ?? {});

  if (theme === "notebook") {
    return (
      <div className={`${articleFontClass} art-notebook`}>
        <main className="art-container">
          <Link href={back.href} className="art-back" aria-label="Back">
            {back.label ?? "← back"}
          </Link>

          <header className="art-header">
            {meta.date && <span className="art-meta">{meta.date}</span>}
            <h1>{meta.title}</h1>
            {meta.tagline && <p className="art-tagline">{meta.tagline}</p>}
          </header>

          <article className="art-article">{children}</article>
        </main>
      </div>
    );
  }

  if (theme === "chat") {
    const density: ArticleDensity = meta.density ?? "md";
    return (
      <div className={`${articleFontClass} art-chat`} data-density={density}>
        <main className="art-container">
          <DensityTabs />
          <Link href={back.href} className="art-back" aria-label="Back">
            {back.label ?? "← back"}
          </Link>

          {/* Sits in the layout chrome — outside .art-article — so the
              article's typography rules don't bleed into the control. */}

          {(meta.date || meta.title || meta.tagline) && (
            <header className="art-header">
              {meta.date && <span className="art-meta">{meta.date}</span>}
              {meta.title && <h1>{meta.title}</h1>}
              {meta.tagline && <p className="art-tagline">{meta.tagline}</p>}
            </header>
          )}

          <article className="art-article">{children}</article>
        </main>
      </div>
    );
  }

  return (
    <div className={`${articleFontClass} art-root`}>
      <Link href={back.href} className="art-back" aria-label="Back">
        {back.label ?? "← back"}
      </Link>

      {tocCfg && <ArticleToc label={tocCfg.label} />}

      <main className="art-container">
        <header className="art-header">
          {meta.date && <span className="art-meta">{meta.date}</span>}
          <h1>{meta.title}</h1>
          {meta.tagline && <p className="art-tagline">{meta.tagline}</p>}
        </header>

        <article className="art-article">{children}</article>
      </main>
    </div>
  );
}
