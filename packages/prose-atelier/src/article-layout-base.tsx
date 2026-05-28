import { ArticleToc } from "./article-toc";
import { DensityTabs } from "./density-tabs";
import type {
  ArticleDensity,
  ArticleLayoutBaseProps,
  ArticleLinkProps,
  ArticleTheme,
} from "./types";

/* ArticleLayoutBase — framework-agnostic article shell.
   See src/types.ts §4 (ArticleLayoutBaseProps) for the prop contract,
   and DESIGN.md §3.2 for where this fits in the module graph. */

const DefaultLink = ({ href, ...rest }: ArticleLinkProps) => (
  <a href={href} {...rest} />
);

export function ArticleLayoutBase({
  meta,
  children,
  fontClass = "",
  linkComponent: Link = DefaultLink,
}: ArticleLayoutBaseProps) {
  const back = meta.back ?? { href: "/", label: "← back" };
  const theme: ArticleTheme = meta.theme ?? "editorial";
  // Notebook + chat are single-column by design — no TOC.
  const tocCfg =
    theme === "notebook" || theme === "chat" || meta.toc === false
      ? null
      : (meta.toc ?? {});

  if (theme === "notebook") {
    return (
      <div className={`${fontClass} art-notebook`.trim()}>
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
      <div className={`${fontClass} art-chat`.trim()} data-density={density}>
        <main className="art-container">
          <DensityTabs />
          <Link href={back.href} className="art-back" aria-label="Back">
            {back.label ?? "← back"}
          </Link>

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
    <div className={`${fontClass} art-root`.trim()}>
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
