# prose-atelier

> 一个面向长文的"排版工坊"：用 MDX 写正文，从一组主题里挑一种声音（editorial / notebook / chat，持续扩充），开箱即得排版 + 代码块 + 图表 + 左栏 TOC。Next.js 一行集成；非 Next.js（Vite / Astro / 任意 React）也能用。

```bash
pnpm add prose-atelier
```

---

## 目录

- [快速开始（Next.js）](#快速开始nextjs)
- [非 Next.js 使用](#非-nextjs-使用)
  - [档位 1：只要样式](#档位-1只要样式)
  - [档位 2：样式 + rehype 管线](#档位-2样式--rehype-管线)
  - [档位 3：样式 + rehype + React 组件](#档位-3样式--rehype--react-组件)
- [Frontmatter 参考](#frontmatter-参考)
- [主题与密度](#主题与密度)
- [CSS 变量定制](#css-变量定制)
- [API 参考](#api-参考)
- [设计文档](#设计文档)
- [限制与已知问题](#限制与已知问题)

---

## 快速开始（Next.js）

三步。

**1. 装包**

```bash
pnpm add prose-atelier
```

**2. 在 root layout 引样式**

```tsx
// app/layout.tsx
import "prose-atelier/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
```

**3. 接入 catchall 路由（一行）**

```ts
// app/[...slug]/page.tsx
export { default, generateStaticParams, dynamicParams } from "prose-atelier/route";
```

把 `.mdx` 文件丢到 `content/` 目录就行。`content/foo.mdx` → `/foo`。

### 需要注入项目自定义组件？5 行版本：

```ts
// app/[...slug]/page.tsx
import * as projectComponents from "@/app/_demos";
import { createMdxRoute } from "prose-atelier/route";

const route = createMdxRoute({ components: projectComponents });
export default route.Page;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
// dynamicParams must be a literal — Next.js statically parses route
// segment config from page.tsx and won't accept a forwarded value.
export const dynamicParams = false;
```

要换内容目录：`createMdxRoute({ contentDir: "posts" })`。

---

## 非 Next.js 使用

接入面按介入深度递增分三档。

### 档位 1：只要样式

适合：Vue / Svelte / 纯 HTML / 已有 markdown 渲染器但羡慕这套排版。

```ts
import "prose-atelier/styles.css";
```

把 markdown 输出包到下面的 class 容器里，CSS 自动接管：

```html
<div class="art-root">
  <main class="art-container">
    <article class="art-article">
      <!-- 你的 markdown 渲染输出（h1/h2/p/pre/code 等标准标签） -->
    </article>
  </main>
</div>
```

> 三种主题分别用 `.art-root`（editorial）、`.art-notebook`（notebook）、`.art-chat[data-density="md"]`（chat）。详见 [主题与密度](#主题与密度)。

字体（可选）—— 我们的 CSS 通过两个变量寻字体，没设也有 system-ui fallback：

```ts
// 任选一种字体来源
import "@fontsource-variable/inter";
import "@fontsource-variable/newsreader";

// 或在你的 CSS 里写：
// :root {
//   --font-article-sans: "Inter", sans-serif;
//   --font-article-serif: "Newsreader", serif;
// }
```

### 档位 2：样式 + rehype 管线

适合：Astro / Vite + `@mdx-js/rollup` / 任何用 unified.js 处理 markdown 的项目。希望我们的 Shiki 高亮、`:::note` 自定义块、code-copy 元数据。

**Vite + `@mdx-js/rollup` 示例：**

```ts
// vite.config.ts
import mdx from "@mdx-js/rollup";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import rehypeShiki from "prose-atelier/rehype-shiki";
import rehypeCustomBlocks from "prose-atelier/rehype-custom-blocks";
import rehypeAddCopyContent from "prose-atelier/rehype-add-copy-content";

export default {
  plugins: [
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        rehypeCustomBlocks,   // 必须在 shiki 之前 — 它把 ```mermaid 块改写成 <MermaidBlock>
        rehypeShiki,
        rehypeAddCopyContent, // 必须在 shiki 之后 — shiki 会重建 <pre><code> 子树
      ],
    }),
  ],
};
```

**Astro 示例：**

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import rehypeShiki from "prose-atelier/rehype-shiki";
import rehypeCustomBlocks from "prose-atelier/rehype-custom-blocks";
import rehypeAddCopyContent from "prose-atelier/rehype-add-copy-content";

export default defineConfig({
  integrations: [
    mdx({
      rehypePlugins: [rehypeCustomBlocks, rehypeShiki, rehypeAddCopyContent],
    }),
  ],
});
```

> `rehype-add-copy-content` 给 `<pre>` 加 `data-content` / `data-lang`，目的是配合 `CodeBlock` 客户端组件做"一键复制"。如果你不用 `CodeBlock`（纯静态渲染），可以省掉这个插件。

### 档位 3：样式 + rehype + React 组件

适合：Vite / Remix / TanStack Start / 任意 React 环境，希望复用 `CodeBlock` / `MermaidBlock` / `ArticleToc` / `ArticleLayoutBase` 全套交互。

```tsx
// app/article.tsx — Vite + React 示例
import Article, { frontmatter } from "../content/example.mdx";
import {
  ArticleLayoutBase,
  CodeBlock,
  MermaidBlock,
  articleMdxComponents,
} from "prose-atelier/core";
import "prose-atelier/styles.css";

export default function Page() {
  return (
    <ArticleLayoutBase meta={frontmatter}>
      <Article components={{
        ...articleMdxComponents,
        pre: CodeBlock,
        MermaidBlock,
      }} />
    </ArticleLayoutBase>
  );
}
```

注入路由库的 `<Link>`：

```tsx
import { Link } from "react-router-dom";

const RRLink = ({ href, children, ...rest }) => (
  <Link to={href} {...rest}>{children}</Link>
);

<ArticleLayoutBase meta={frontmatter} linkComponent={RRLink}>
  ...
</ArticleLayoutBase>
```

---

## Frontmatter 参考

每篇 `.mdx` 文件顶部用 YAML 写 frontmatter：

```mdx
---
title: 我的文章
date: 2026-05-11
tagline: 一行说明
theme: editorial
toc:
  label: 目录
---

正文从这里开始。
```

| 字段       | 类型                              | 必填 | 默认                       | 说明 |
|------------|-----------------------------------|------|----------------------------|------|
| `title`    | `string`                          | ✓    | —                          | H1 + 标签页标题 |
| `date`     | `string`                          |      | 不显示                     | 自由格式，原样渲染 |
| `tagline`  | `string` / MDX                    |      | 不显示                     | 副标题 |
| `back`     | `{ href, label? }`                |      | `{ href: "/", label: "← back" }` | 顶部返回链接 |
| `theme`    | `"editorial"` / `"notebook"` / `"chat"` |  | `"editorial"`              | 视觉主题 |
| `density`  | `"xs"` / `"sm"` / `"md"` / `"lg"` |      | `"md"`                     | 仅 chat 主题；正文字号刻度 |
| `toc`      | `{ label? }` / `false`            |      | 显示                       | 仅 editorial 主题；`false` 关掉 TOC |

完整类型见 [`src/types.ts`](./src/types.ts) 的 `ArticleMeta`。

---

## 主题与密度

三套主题各有自己的 CSS 文件、各自的根 class、各自的设计目标。

| 主题       | 根 class       | 设计目标                                      | TOC | CJK 友好 |
|------------|----------------|-----------------------------------------------|-----|----------|
| editorial  | `.art-root`    | 杂志感，左侧固定 TOC，h2 作为章节分割线       | ✓   |          |
| notebook   | `.art-notebook`| 单栏技术博客，行内 h2，下划虚线 `<em>`        |     | ✓        |
| chat       | `.art-chat`    | AI 工具回复内容（密集列表、混合代码块、stdout）|     | ✓        |

chat 主题密度用 `data-density` 属性切换：

```html
<div class="art-chat" data-density="md">…</div>
```

`xs` / `sm` / `md` / `lg` 四档。chat 主题自带 `<DensityTabs />` 组件让用户在浏览器里实时切换。

---

## CSS 变量定制

视觉层面的轻量定制都走 CSS 变量。在你应用的 CSS 里覆盖即可，不需要改包源码。

### 通用字体

```css
:root {
  --font-article-sans: "Inter", sans-serif;
  --font-article-serif: "Newsreader", serif;
}
```

### editorial 主题（`--art-*`）

```css
.art-root {
  --art-bg: #fdfdfc;
  --art-text: #161616;
  --art-text-soft: #4a4a4a;
  --art-heading-soft: hsla(0, 0%, 7%, 0.4);
  --art-link: #3e9fff;
  --art-accent: #3e9fff;
}
```

### notebook 主题（`--nb-*`）

```css
.art-notebook {
  --nb-bg: #ffffff;
  --nb-text: #1a1a1a;
  --nb-text-strong: #000;
  --nb-surface: #f5f5f4;
  /* …更多见 article-notebook.css */
}
```

### chat 主题（`--ch-*`）

密度由 `[data-density]` 选择器内部切换，自定义颜色见 `article-chat.css`。

> 改变量都向后兼容；改主题骨架结构（HTML class 嵌套）就要 vendor `app/_mdx/` 自己改了。

---

## API 参考

完整类型 + 模块关系说明在 [`src/types.ts`](./src/types.ts)（每个类型都有 doc-comment）。

### 顶层（Next.js）

```ts
import {
  MDXArticle,         // 服务端组件，直接接收 MDX 源码字符串
  ArticleLayout,      // Next 适配版 layout（带 next/link + next/font）
  type ArticleMeta,
  type MDXArticleProps,
} from "prose-atelier";
```

### `/route`（Next.js 路由助手）

```ts
import {
  createMdxRoute,
  type CreateMdxRouteOptions,
} from "prose-atelier/route";
```

### `/core`（任意 React 环境）

```ts
import {
  ArticleLayoutBase,    // 框架无关版式（接受 linkComponent prop）
  CodeBlock,            // 客户端代码块壳子（语言标签 + 复制 + 折叠）
  MermaidBlock,         // 客户端 mermaid 渲染
  ArticleToc,           // editorial 主题左侧 TOC（客户端，scroll-spy）
  DensityTabs,          // chat 主题密度切换器
  Demo,                 // 带边框的 demo 容器
  DemoFrame,
  DemoCaption,
  articleMdxComponents, // 默认 MDX 元素覆盖映射
  type ArticleMeta,
  type ArticleLayoutBaseProps,
  type ArticleLinkProps,
} from "prose-atelier/core";
```

### `/fonts`（next/font 字体类）

```ts
import { articleFontClass } from "prose-atelier/fonts";
```

### `/rehype-*`（rehype 插件）

```ts
import rehypeShiki from "prose-atelier/rehype-shiki";
import rehypeCustomBlocks from "prose-atelier/rehype-custom-blocks";
import rehypeAddCopyContent from "prose-atelier/rehype-add-copy-content";
```

---

## 设计文档

完整的设计取舍、模块依赖图、消费者模型分层在 [`DESIGN.md`](./DESIGN.md)。改 API 表面之前先读那里。

---

## 相关工具

- **[`markdown-preview`](https://github.com/zilin/markdown-preview)** —— 一个独立的命令行工具，用本包的 CSS + rehype 插件渲染本地 `.md` 文件到浏览器。零服务器、零 React。同时也是本包「框架无关」能力的活体验证。

---

## 限制与已知问题

- **Vue / Svelte 用户拿不到 React 组件**。你只能用 CSS（档位 1）+ 可选 rehype 插件（档位 2），交互组件（复制按钮、Mermaid 渲染、TOC scroll-spy）需自行实现。
- **不在浏览器编译 MDX**。包不提供 client-side MDX runtime；要这种场景的人请用 `mdx-bundler` 或 `next-mdx-remote/serialize`。
- **Mermaid 是按需懒加载的客户端依赖**（约 800KB minified gzipped 200KB+）。无 mermaid 块的页面不付这份成本。
- **TOC 只在 editorial 主题渲染**。notebook 和 chat 主题刻意单栏，TOC 不适配。
- **`createMdxRoute` 默认读 `process.cwd()/content`**。在 Next.js 之外的运行时（test 环境、edge runtime）会失败 —— 它本来就是 Next-only。

---

## License

MIT.
