import type { ComponentProps, ReactNode } from "react";
import type { MDXComponents } from "mdx/types";

/* ============================================================
 *  Public primitives — usable inside MDX or any TSX page.
 * ============================================================ */

export function DemoFrame({
  theme,
  children,
}: {
  theme?: "dark" | "light";
  children: ReactNode;
}) {
  return (
    <div className="art-demo-frame" data-theme={theme}>
      {children}
    </div>
  );
}

export function DemoCaption({
  tag,
  children,
}: {
  tag?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="art-demo-caption">
      <span>{children}</span>
      {tag != null && <span className="art-demo-tag">{tag}</span>}
    </div>
  );
}

export function Demo({
  theme,
  caption,
  tag,
  children,
}: {
  theme?: "dark" | "light";
  caption?: ReactNode;
  tag?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="art-demo">
      <DemoFrame theme={theme}>{children}</DemoFrame>
      {caption != null && <DemoCaption tag={tag}>{caption}</DemoCaption>}
    </div>
  );
}

/* ============================================================
 *  MDX element overrides — h2 becomes a section divider with
 *  its anchor-id intact (consumed by ArticleToc).
 * ============================================================ */

function H2({ id, children, ...rest }: ComponentProps<"h2">) {
  return (
    <h2 id={id} {...rest}>
      <span>{children}</span>
    </h2>
  );
}

function HR() {
  return <hr className="art-divider-dots" role="separator" />;
}

/* Components MDX files can use by name (no imports needed since we render
   at runtime via next-mdx-remote). MDX element overrides + the editorial
   primitives (Demo / DemoFrame / DemoCaption) live together so a vendoring
   project gets them all in one map. */
export const articleMdxComponents: MDXComponents = {
  h2: H2,
  hr: HR,
  Demo,
  DemoFrame,
  DemoCaption,
};
