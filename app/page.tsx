import Link from "next/link";

const FONT_STACK =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const SERIF_STACK =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INK = "#1f1b16";
const INK_SOFT = "rgba(31, 27, 22, 0.62)";
const INK_FAINT = "rgba(31, 27, 22, 0.42)";
const ACCENT = "#a85a1f";
const HAIRLINE = "rgba(31, 27, 22, 0.12)";

export default function Index() {
  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        fontFamily: FONT_STACK,
        color: INK,
        background:
          "radial-gradient(120% 80% at 12% 0%, #fff3df 0%, transparent 55%)," +
          "radial-gradient(90% 70% at 100% 10%, #ffe1bf 0%, transparent 60%)," +
          "radial-gradient(110% 90% at 90% 100%, #e8efd6 0%, transparent 65%)," +
          "linear-gradient(180deg, #fdf8ee 0%, #fbf3e3 100%)",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(31,27,22,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(80% 60% at 50% 30%, #000 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(80% 60% at 50% 30%, #000 30%, transparent 75%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: "62rem",
          margin: "0 auto",
          padding: "2.5rem 1.75rem 4rem",
          display: "flex",
          flexDirection: "column",
          gap: "3.5rem",
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.9rem",
            color: INK_SOFT,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              letterSpacing: "-0.005em",
              color: INK,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: ACCENT,
                boxShadow: "0 0 0 4px rgba(168,90,31,0.14)",
              }}
            />
            Next.js MDX template
          </span>
          <a
            href="https://github.com/hifizz/mdx-article-template"
            target="_blank"
            rel="noreferrer"
            aria-label="View source on GitHub"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 999,
              color: INK,
              background: "rgba(255,255,255,0.6)",
              border: `1px solid ${HAIRLINE}`,
              backdropFilter: "blur(8px)",
            }}
          >
            <GitHubMark />
          </a>
        </header>

        {/* Hero */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            paddingTop: "2.5rem",
          }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              fontSize: "0.9rem",
              fontWeight: 500,
              color: ACCENT,
              padding: "0.4rem 0.9rem",
              border: `1px solid ${HAIRLINE}`,
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.55)",
              backdropFilter: "blur(8px)",
            }}
          >
            Drop an .mdx file. Done.
          </span>

          <h1
            style={{
              margin: 0,
              fontFamily: SERIF_STACK,
              fontWeight: 500,
              fontSize: "clamp(2.5rem, 6vw, 4.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: "20ch",
            }}
          >
            Editorial articles,
            <br />
            <span style={{ fontStyle: "italic", color: ACCENT }}>
              without the boilerplate
            </span>
            .
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: "44ch",
              fontSize: "1.125rem",
              lineHeight: 1.6,
              color: INK_SOFT,
            }}
          >
            A Next.js template for long-form writing — typography, left-rail
            TOC, Shiki-tokenized code with copy &amp; auto-collapse, and Mermaid
            diagrams. Drop a file in <code style={codeInline}>content/</code>,
            run <code style={codeInline}>pnpm dev</code>, ship.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
              marginTop: "0.75rem",
            }}
          >
            <Link
              href="/example"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.85rem 1.4rem",
                background: INK,
                color: "#fdf8ee",
                borderRadius: 999,
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: 500,
                letterSpacing: "0.01em",
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.4) inset, 0 10px 24px -12px rgba(31,27,22,0.55)",
              }}
            >
              Editorial demo
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/example-notebook"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.85rem 1.4rem",
                background: "rgba(255,255,255,0.85)",
                color: INK,
                borderRadius: 999,
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: 500,
                border: `1px solid ${HAIRLINE}`,
                backdropFilter: "blur(8px)",
              }}
            >
              Notebook demo
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/example-chat"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.85rem 1.4rem",
                background: "rgba(255,255,255,0.85)",
                color: INK,
                borderRadius: 999,
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: 500,
                border: `1px solid ${HAIRLINE}`,
                backdropFilter: "blur(8px)",
              }}
            >
              Chat demo
              <span
                aria-hidden
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  color: ACCENT,
                  padding: "0.1rem 0.45rem",
                  borderRadius: 999,
                  background: "rgba(168, 90, 31, 0.1)",
                  letterSpacing: "0.04em",
                }}
              >
                NEW
              </span>
              <span aria-hidden>→</span>
            </Link>
            <a
              href="https://github.com/hifizz/mdx-article-template#readme"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: "0.85rem",
                color: INK_FAINT,
                marginLeft: "0.25rem",
                textDecoration: "underline",
                textDecorationColor: HAIRLINE,
                textUnderlineOffset: 4,
              }}
            >
              Read the README
            </a>
          </div>
        </section>

        {/* Feature row */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
            gap: "1rem",
          }}
        >
          {FEATURES.map((f) => (
            <article
              key={f.title}
              style={{
                padding: "1.4rem 1.4rem 1.5rem",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.5) 100%)",
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 18,
                backdropFilter: "blur(10px)",
                display: "flex",
                flexDirection: "column",
                gap: "0.55rem",
              }}
            >
              <span
                aria-hidden
                style={{
                  fontFamily: SERIF_STACK,
                  fontStyle: "italic",
                  fontSize: "0.85rem",
                  color: ACCENT,
                  letterSpacing: "0.02em",
                }}
              >
                {f.label}
              </span>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.92rem",
                  lineHeight: 1.55,
                  color: INK_SOFT,
                }}
              >
                {f.body}
              </p>
            </article>
          ))}
        </section>

        {/* Footer */}
        <footer
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem 1.5rem",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "1.5rem",
            borderTop: `1px solid ${HAIRLINE}`,
            fontSize: "0.88rem",
            color: INK_SOFT,
          }}
        >
          <span style={{ color: INK_FAINT }}>
            Built with Next.js · next-mdx-remote · Shiki · Mermaid
          </span>
          <span>
            Made by{" "}
            <a
              href="https://zilin.im"
              target="_blank"
              rel="noreferrer"
              style={{
                color: INK,
                textDecoration: "none",
                fontFamily: SERIF_STACK,
                fontStyle: "italic",
                borderBottom: `1px solid ${ACCENT}`,
                paddingBottom: 1,
              }}
            >
              zilin.im
            </a>
          </span>
        </footer>
      </div>
    </main>
  );
}

const codeInline: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  fontSize: "0.92em",
  padding: "0.1em 0.4em",
  borderRadius: 6,
  background: "rgba(31, 27, 22, 0.06)",
  border: `1px solid ${HAIRLINE}`,
};

function GitHubMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

const FEATURES = [
  {
    label: "01",
    title: "MDX in, article out",
    body: "Drop a .mdx file under content/. The catchall route renders it with typography, TOC, and metadata. No imports, no layout wrapping.",
  },
  {
    label: "02",
    title: "Code that reads like prose",
    body: "Shiki tokens, line highlights, diff markers, focus, errors, copy, and auto-collapse on tall blocks — all on by default.",
  },
  {
    label: "03",
    title: "Vendorable in 30 seconds",
    body: "app/_mdx/ is a self-contained folder. Copy it into any Next.js project, add a content directory, ship.",
  },
];
