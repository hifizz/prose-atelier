# 计划：把 `app/_mdx/` 抽成一个发布到 npm 的 Next.js 包

## 背景

`article-template` 仓库的 MDX 渲染管线集中在 `app/_mdx/` —— 一个自包含的目录（renderer、layout、两套主题、code-block 外壳、Mermaid 块、TOC、三个 rehype 插件）。今天用户的接入方式是把这个目录复制进自己的项目（vendor-and-edit 模式）。希望把它变成一个真正的 NPM 包，使用方可以 `pnpm add` 装上、走 semver 升级、不用再 vendor。

通过 Explore 确认的关键事实：

- 目录是真正自包含的 —— 没有 `@/...` 别名，全是相对导入。
- 三个组件带 `"use client"` 指令 —— `article-toc.tsx`、`code-block.tsx`、`mermaid-block.tsx`，打包时必须保留。
- `fonts.ts` 用了 `next/font/google`（Inter + Newsreader），所以 `next` 是 peer dependency。
- 所有 CSS import 都集中在 `article-layout.tsx`（4 个文件）。
- 三个 rehype 插件是纯 ESM，没有 `process.cwd()` / `__dirname` 引用，可原样发布。
- catchall 路由 + `content/` 目录 + 项目自有的 demo 组件 —— 这些留在使用方的应用里，不进包。

用户已确认的三个选择：

- **目标**：公开发布到 npm。
- **仓库结构**：另起新仓库做包；本仓库继续作为 vendor-and-edit 模板 + demo。
- **CSS 交付方式**：在使用方的 root layout 显式 `import "<pkg>/styles.css"`（NPM 包惯例，加载顺序由消费者掌控）。

## 总体方案

新建公开仓库 `next-mdx-article`（最终包名待确认；本计划用 `next-mdx-article` 作工作名）。用 **bunchee** 构建 —— Vercel 出品、专为 React 组件库设计的 Rollup 封装，原生保留 `"use client"` 指令、零配置一次性出 ESM + 类型。仅发布 ESM，配合一份合并 CSS 和三个独立子路径暴露的 rehype 插件，方便消费者在需要时绕过我们的 renderer 自己组合管线。

定制模型刻意保持**简单 + CSS 变量驱动**，不引入庞大的 options/props API —— 这样能保留 vendor-and-edit 模式那种「改一处就能见效」的手感。真正会被换的几样东西（Shiki 主题、自定义 MDX 组件、强调色），通过一小撮 props + CSS 变量暴露即可。

**把 catchall 路由作为子路径导出** —— 这是消费者本来要复制的最大一坨样板代码。零配置场景一行 re-export 搞定；要注入自定义 MDX 组件时也只要 5 行。

## 使用者接入体验（发布之后）

终端用户的体验决定了 API 形态。总共 3 步：

**第 1 步 —— 安装：**

```bash
pnpm add next-mdx-article
```

**第 2 步 —— 在 root layout 里 import 一次 CSS：**

```tsx
// app/layout.tsx
import "next-mdx-article/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
```

**第 3 步 —— 接入 catchall 路由，两种写法：**

零配置（一行）：

```ts
// app/[...slug]/page.tsx
export { default, generateStaticParams, dynamicParams } from "next-mdx-article/route";
```

需要注入自定义 MDX 组件（5 行）：

```ts
// app/[...slug]/page.tsx
import * as demos from "@/app/_demos";
import { createMdxRoute } from "next-mdx-article/route";

const route = createMdxRoute({ components: demos });
export default route.Page;
export const { generateStaticParams, dynamicParams } = route;
```

完。消费者把 `.mdx` 文件丢到 `content/` 里，路由自动生成。仓库里不会出现 `fs.readdir`、`notFound()`、`generateStaticParams` 这些样板。

约定：包默认读 `process.cwd()/content`。如要换目录，传 `createMdxRoute({ contentDir: "posts" })`。

## 关键文件（新仓库内）

```
next-mdx-article/
├── src/
│   ├── index.ts                  → re-export MDXArticle、ArticleLayout、
│   │                                CodeBlock、MermaidBlock、ArticleToc、
│   │                                Demo / DemoFrame / DemoCaption、
│   │                                articleMdxComponents、articleFontClass、
│   │                                ArticleMeta / ArticleTheme 类型
│   ├── route.tsx                 新增 —— catchall 路由帮助函数
│   │                                （createMdxRoute + 零配置默认导出）
│   ├── renderer.tsx              ← 来自 app/_mdx/renderer.tsx
│   ├── article-layout.tsx        ← 来自 app/_mdx/article-layout.tsx
│   ├── article-toc.tsx           ← 原样复制（保留 "use client"）
│   ├── code-block.tsx            ← 原样复制（保留 "use client"）
│   ├── mermaid-block.tsx         ← 原样复制（保留 "use client"）
│   ├── components.tsx            ← 原样复制（Demo / DemoFrame / DemoCaption）
│   ├── fonts.ts                  ← 原样复制（next/font/google）
│   ├── rehype-shiki.mjs          ← 原样复制
│   ├── rehype-custom-blocks.mjs  ← 原样复制
│   ├── rehype-add-copy-content.mjs ← 原样复制
│   └── styles/
│       ├── article.css
│       ├── article-notebook.css
│       ├── code-block.css
│       └── mermaid-block.css
├── package.json
├── tsconfig.json
├── bunchee.config.ts             （或不写，bunchee 零配置）
├── README.md                     （使用文档 + 快速接入示例）
└── LICENSE
```

源码层面相对原文件需要改动两处：

1. **`article-layout.tsx`** —— 删掉四行 CSS `import`（CSS 改为消费者显式导入）。
2. **`route.tsx`** —— 新文件。把 `fs.readdir` 遍历器、`generateStaticParams`、默认 page 组件，从 `app/[...slug]/page.tsx` 抽到一个可复用的工厂函数里。

`src/route.tsx` 草图：

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { MDXArticle, type MDXArticleProps } from "./renderer";

export type CreateMdxRouteOptions = {
  /** 默认："content"（相对 process.cwd() 解析）。 */
  contentDir?: string;
  /** 项目自定义 React 组件，MDX 文件可按名引用。 */
  components?: MDXArticleProps["components"];
};

export function createMdxRoute(opts: CreateMdxRouteOptions = {}) {
  const dir = path.join(process.cwd(), opts.contentDir ?? "content");

  async function listMdxSlugs(/* 递归遍历，照搬当前 page.tsx 实现 */) { /* ... */ }
  async function readSource(slug: string[]) { /* ... */ }

  async function generateStaticParams() {
    const slugs = await listMdxSlugs(dir);
    return slugs.map((slug) => ({ slug }));
  }

  async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    const source = await readSource(slug);
    if (source == null) notFound();
    return <MDXArticle source={source} components={opts.components} />;
  }

  return { Page, generateStaticParams, dynamicParams: false as const };
}

// 零配置默认导出 —— 让一行 re-export 形态能直接用
const _default = createMdxRoute();
export default _default.Page;
export const generateStaticParams = _default.generateStaticParams;
export const dynamicParams = _default.dynamicParams;
```

其余文件从 `app/_mdx/` 原样复制。

## 公共 API（`exports` 字段）

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./route": {
      "types": "./dist/route.d.ts",
      "default": "./dist/route.js"
    },
    "./styles.css": "./dist/styles.css",
    "./rehype-shiki": "./dist/rehype-shiki.mjs",
    "./rehype-custom-blocks": "./dist/rehype-custom-blocks.mjs",
    "./rehype-add-copy-content": "./dist/rehype-add-copy-content.mjs"
  },
  "sideEffects": ["**/*.css"]
}
```

`./styles.css` 由 bunchee 把 `src/styles/` 下四个 CSS 文件合并产出（如果 bunchee 不做 CSS 合并，构建步骤额外写一份 `dist/styles.css` 用 `@import` 引入这四个子文件）。

## 定制模型

刻意保持浅：

- **Shiki 主题 / 代码块微调**：要换主题的消费者，从 `next-mdx-article/rehype-shiki` 引入插件构造器并自己组装 rehype 管线即可；默认的 `MDXArticle` 继续用我们内置的插件 + 默认值。
- **MDX 元素覆盖**：现有 `MDXArticle` 的 `components` prop 已经覆盖（`Record<string, ComponentType<any>>`），不变。
- **配色 / 间距 / 字体**：用 CSS 变量。两套主题已经在用 `--art-*` / `--nb-*`，README 里把这些列成清单，让消费者在自己的 CSS 里覆盖。
- **整套布局替换**：现有 `MDXArticle` 的 `layout` prop 已经允许整体替换 `ArticleLayout`，不变。

不引入新的 options 包。原本要改文件的地方，要么留作消费者自己的代码改写，要么变成 CSS 变量。

## 构建与发布（`dependencies` / `peerDependencies`）

```jsonc
{
  "name": "next-mdx-article",
  "version": "0.1.0",
  "type": "module",
  "files": ["dist", "README.md", "LICENSE"],
  "peerDependencies": {
    "next": ">=14",
    "react": ">=18",
    "react-dom": ">=18"
  },
  "dependencies": {
    "@shikijs/rehype": "^4.0.2",
    "@shikijs/transformers": "^4.0.2",
    "shiki": "^4.0.2",
    "next-mdx-remote": "^6.0.0",
    "rehype-slug": "^6.0.0",
    "unist-util-visit": "^5.1.0",
    "mermaid": "^11.14.0"
  },
  "devDependencies": {
    "bunchee": "latest",
    "typescript": "^5",
    "@types/react": "^19",
    "@types/react-dom": "^19"
  },
  "scripts": {
    "build": "bunchee",
    "dev": "bunchee --watch",
    "prepublishOnly": "bunchee"
  }
}
```

为什么选 bunchee：Vercel 为 React 组件库定制，零配置即可保留 `"use client"`，一次性出 ESM + 类型，正好契合本包形态。

## 迁移步骤（按顺序）

1. **新建仓库骨架** —— `gh repo create next-mdx-article --public`，加 LICENSE（MIT）、`.gitignore`、`tsconfig.json`，建空 `src/`。
2. **复制源码** —— `cp -r app/_mdx/* next-mdx-article/src/`，把 CSS 移到 `src/styles/`。
3. **改 `article-layout.tsx`** —— 删四行 CSS `import`。
4. **新增 `src/route.tsx`** —— 把 `app/[...slug]/page.tsx` 里的 `fs.readdir` 遍历器、`generateStaticParams`、默认 Page 抽到上文「关键文件」中草拟的 `createMdxRoute` 工厂。文件末尾追加零配置默认导出。
5. **更新 `src/index.ts`** —— 重新 re-export 公共 API（`route.tsx` 不在这里 re-export，它是子路径）。
6. **写 `package.json`** —— 按上面的清单。
7. **写 `README.md`** —— 三步快速接入（一行 re-export 形态 + 5 行 `createMdxRoute` 形态）、frontmatter 字段说明、`theme: notebook` 用法、CSS 变量速查表。
8. **构建 + 冒烟** —— `pnpm install && pnpm build`，确认 `dist/` 有 `.js` + `.d.ts` + `.css`，且 `dist/article-toc.js`、`dist/code-block.js`、`dist/mermaid-block.js` 首行仍是 `"use client";`，并确认 `dist/route.js` 存在。
9. **本仓库本地链接验证** —— 在 `article-template` 里 `pnpm add ../next-mdx-article`（file: 链接），把 `app/[...slug]/page.tsx` 缩成一行 re-export，给 `app/layout.tsx` 加上 `import "next-mdx-article/styles.css"`，跑 `pnpm dev` 确认 `/example`、`/example-notebook` 仍能正常渲染。
10. **发布** —— 在新仓库 `npm publish --access public`。
11. **更新 `article-template`** —— 把本地 file: 链接换成已发布版本，README 增加「两种接入模式」的说明（vendor `app/_mdx/` 或 `pnpm add next-mdx-article`）。

vendor-and-edit 路径在 `article-template` 里继续保留 —— 一份源码两种发行方式，直到日后决定淘汰其中之一。

## 验证清单

发布前先在本仓库端到端测试一遍：

1. **包能 build**（在新仓库内）：
   `pnpm build` 必须退出 0；检查 `dist/` 含 `index.js`、`index.d.ts`、`route.js`、`styles.css`、三个 `rehype-*.mjs`。
2. **客户端指令保留**：
   `head -1 dist/code-block.js` 应输出 `"use client";`（`mermaid-block.js`、`article-toc.js` 同理）。
3. **本仓库本地链接**：
   `pnpm add ../next-mdx-article` —— 把 `app/[...slug]/page.tsx` 缩成一行 re-export `export { default, generateStaticParams, dynamicParams } from "next-mdx-article/route";`，给 `app/layout.tsx` 加 `import "next-mdx-article/styles.css"`。然后 `article-template` 的 `pnpm build` 必须成功并能 SSG `/example`（editorial）和 `/example-notebook`（notebook）。
4. **视觉肉眼对照** —— `pnpm dev`，打开两个路由对比当前 main 分支截图。不要求像素级一致，但版式、字体、代码块外壳、Mermaid 图、TOC 行为都必须对齐。
5. **冷装演练** —— 新仓库内 `npm pack`，到一个临时 Next.js 应用 `pnpm add ./next-mdx-article-0.1.0.tgz`，把一个 `content/example.mdx` 复制过去，确认能渲染。
6. **以上四步都过了之后**：才执行 `npm publish --access public`。

## 退出 Plan 模式前要确认的开放项

- 最终包名：工作名 `next-mdx-article`。备选：`@hifizz/next-mdx-article`（用户私有 scope，必然可用）、`@writemdx/next`（贴合首页 "Write MDX" 的标语）。
- 是否要把 `CodeBlock`、`MermaidBlock`、`ArticleToc` 三个零部件也在顶层 `index.ts` re-export。建议：是。当前 `app/_mdx/index.ts` 就是这么导的，保持一致。
