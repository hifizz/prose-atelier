import Link from "next/link";

export default function Index() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        color: "#111",
        background: "#fdfdfc",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
        article-template
      </h1>
      <p style={{ margin: 0, color: "rgba(0,0,0,0.55)", fontSize: "0.9rem" }}>
        MDX article template. See{" "}
        <Link
          href="/example"
          style={{ color: "#3e9fff", textDecoration: "underline" }}
        >
          /example
        </Link>{" "}
        for the live demo, or read the README to add your own.
      </p>
    </main>
  );
}
