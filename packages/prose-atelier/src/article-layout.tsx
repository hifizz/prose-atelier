import Link from "next/link";
import type { ReactNode } from "react";

import { articleFontClass } from "./fonts";
import { ArticleLayoutBase } from "./article-layout-base";
import type { ArticleLinkProps, ArticleMeta } from "./types";

/* ArticleLayout — Next.js-flavored adapter. Injects next/link and the
   next/font font-variable class. See DESIGN.md §3.2.

   Note: CSS imports do NOT live here. Consumers call
   `import "prose-atelier/styles.css"` from their root layout. This
   keeps the package free of side-effect CSS imports in JS modules,
   which let consumers control load order and tree-shaking. */

const NextLinkAdapter = ({ href, children, ...rest }: ArticleLinkProps) => (
  <Link href={href} {...rest}>
    {children}
  </Link>
);

export function ArticleLayout({
  meta,
  children,
}: {
  meta: ArticleMeta;
  children: ReactNode;
}) {
  return (
    <ArticleLayoutBase
      meta={meta}
      fontClass={articleFontClass}
      linkComponent={NextLinkAdapter}
    >
      {children}
    </ArticleLayoutBase>
  );
}
