import type { Metadata } from "next";
import "./globals.css";
import "prose-atelier/styles.css";

export const metadata: Metadata = {
  title: "Write MDX, see it live with Next.js",
  description:
    "MDX-driven editorial article template with left-rail TOC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
