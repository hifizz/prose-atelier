import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "article-template",
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
