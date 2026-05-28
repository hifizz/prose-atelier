# prose-atelier — 设计文档

> 这是 **设计参考**，不是教程。教程在 `README.md`。
> 这是 **稳定契约**，每次改 API 表面都要先在这里改。

---

## 1. 为什么有这个包

`article-template` 仓库做的事情：用 MDX 写一篇带 frontmatter 的文章，渲染出有左侧 TOC、排版讲究、代码块带复制按钮、支持 Mermaid 图、有三套主题（editorial / notebook / chat）的页面。

之前的复用模型是「vendor-and-edit」：把整个 `app/_mdx/` 目录复制进自己的项目改。问题：

- 改了之后回不到主线，升级要 diff 一遍。
- 同一段代码出现在每个使用方的仓库里，修 bug 改三遍。
- 接入门槛高 —— 必须看懂目录结构。

把它做成 npm 包，就是为了让接入方写**一行 `pnpm add`** + **一行路由 re-export** 就能用，同时不锁死框架 —— Vite / Astro / 任意 React 环境都能复用，连 Vue / 静态站点也能用上 CSS 和 rehype 插件。

---

## 2. 范围与非范围

### 在范围内

- **文章版式**：editorial / notebook / chat 三套主题，TOC 行为，排版细节。
- **MDX 渲染管线（Next.js 一档）**：`MDXArticle` 服务端组件，`createMdxRoute` 文件系统路由助手。
- **rehype 插件**：Shiki 高亮、`:::note` 类自定义块、复制按钮 metadata 注入。
- **客户端交互组件**：复制按钮、Mermaid 渲染、TOC 滚动联动、密度切换。
- **CSS**：所有视觉样式，CSS 变量驱动定制。

### 不在范围内

- **不是通用 MDX 渲染器**。我们提供的是「文章版式 + 一组可插拔的 rehype 插件」。非 Next 用户用自己的 MDX 编译器（`@mdx-js/rollup`、`@astrojs/mdx`、`mdx-bundler` 等），把编译结果塞进 `ArticleLayoutBase`。
- **不是 Vue/Svelte 端口**。React 组件不可移植；非 React 框架只能拿 CSS 和 rehype 插件。
- **不收 props 配置爆炸**。视觉层面的定制走 CSS 变量；行为层面的定制（Shiki 主题、自定义 MDX 元素）走插件构造器或 `components` prop。

### 故意省略

- 没有 i18n。`<Link>` 和返回标签的文案由消费者注入。
- 没有评论 / 分享 / 点赞按钮。这些和"文章版式"无关。
- 没有 RSS / sitemap。Next 用户走 Next 的 metadata API。

---

## 3. 模块地图

包对外暴露 **5 个 JS 入口**（exports 子路径）+ **1 个 CSS 入口** + **3 个 rehype 插件子路径**。每个入口的存在理由都是消费者环境不同，不能合并。

```
prose-atelier/
├── .                              ← 顶层（Next.js）
├── /core                          ← 框架无关
├── /route                         ← Next.js（catchall 路由助手）
├── /fonts                         ← Next.js（next/font 字体类）
├── /styles.css                    ← 任意（合并样式）
├── /rehype-shiki                  ← 任意（rehype 插件）
├── /rehype-custom-blocks          ← 任意（rehype 插件）
└── /rehype-add-copy-content       ← 任意（rehype 插件）
```

### 3.1 入口与所属环境

| 入口                                  | 框架要求    | 谁会 import 它           |
|---------------------------------------|-------------|--------------------------|
| `prose-atelier`                    | Next.js     | Next 应用根              |
| `prose-atelier/core`               | 任意 React  | Vite/Remix/Astro+React   |
| `prose-atelier/route`              | Next.js     | `app/[...slug]/page.tsx` |
| `prose-atelier/fonts`              | Next.js     | Next 应用根（可选）      |
| `prose-atelier/styles.css`         | 任意        | 任意应用根               |
| `prose-atelier/rehype-*`           | 任意        | 自建 MDX 管线的项目      |

### 3.2 内部模块依赖图

```
┌─────────────────────────────────────────────────────────────┐
│  顶层入口（Next.js 一档）                                   │
│  index.ts                                                   │
│  ├─ MDXArticle ────────────► renderer.tsx                   │
│  │                            ├─ next-mdx-remote/rsc        │
│  │                            ├─ ArticleLayout              │
│  │                            ├─ rehype-* (3 plugins)       │
│  │                            └─ articleMdxComponents       │
│  └─ ArticleLayout (Next 适配薄壳)                           │
│     └─ article-layout.tsx ──► article-layout-base.tsx       │
│         （注入 next/link + articleFontClass）               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ depends on
┌─────────────────────────────────────────────────────────────┐
│  /core 入口（框架无关）                                     │
│  core.ts                                                    │
│  ├─ ArticleLayoutBase ─► article-layout-base.tsx            │
│  │                       ├─ ArticleToc                      │
│  │                       └─ DensityTabs                     │
│  ├─ CodeBlock ────────► code-block.tsx       ("use client") │
│  ├─ MermaidBlock ─────► mermaid-block.tsx    ("use client") │
│  ├─ ArticleToc ───────► article-toc.tsx      ("use client") │
│  ├─ DensityTabs ──────► density-tabs.tsx     ("use client") │
│  ├─ Demo / DemoFrame / DemoCaption                          │
│  │                  ─► components.tsx                       │
│  ├─ articleMdxComponents (默认元素映射表)                   │
│  └─ types ────────────► types.ts                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ peer to
┌─────────────────────────────────────────────────────────────┐
│  /route 入口（Next.js 文件系统路由助手）                    │
│  route.tsx                                                  │
│  ├─ createMdxRoute(opts) → { Page, generateStaticParams,    │
│  │                            dynamicParams }               │
│  ├─ 默认导出（零配置） ─► createMdxRoute() 实例             │
│  └─ 内部依赖：fs/promises, path, next/navigation,           │
│              renderer.tsx 的 MDXArticle                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  /fonts 入口（next/font 字体变量）                          │
│  fonts.ts                                                   │
│  └─ articleFontClass (next/font/google: Inter + Newsreader) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  /rehype-* 入口（纯 ESM rehype 插件）                       │
│  rehype-shiki.mjs        ─► Shiki + transformers            │
│  rehype-custom-blocks.mjs ─► :::note 等自定义块             │
│  rehype-add-copy-content  ─► <pre> 注入 data-content / lang │
│  这三个文件没有 React/Next 依赖，可单独被任意 unified 管线  │
│  消费。                                                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 关键不变量

1. **`/core` 决不能 import `next/*` 或 `next-mdx-remote/*`**。CI 检查：`grep -r "next/" dist/core*.js dist/article-layout-base*.js` 必须无命中。
2. **`"use client"` 指令必须存活到 `dist/`**。bunchee 默认保留，但要在每次 build 后用 `head -1 dist/code-block.js` 校验。
3. **`fonts.ts` 不能被 `/core` 间接引用**。否则非 Next 项目装包就会触发 `next/font` 解析失败。
4. **`peerDependenciesMeta.next.optional = true`**。否则非 Next 用户 `pnpm add` 会报 missing peer。
5. **CSS 字体变量必须有 system-ui fallback**。`var(--font-article-sans)` 的位置必须紧跟 fallback 字体链 —— 没设变量也能渲染。

---

## 4. 三档消费者模型

按介入深度递增。这是 README 三档教程的设计依据，**这一节解释为什么这样切**。

### 档位 1：只要样式

谁：Vue / Svelte / 纯 HTML / 已有自家 markdown 渲染器但羡慕这套排版的 React 用户。

接入面：`/styles.css`。

设计约束：CSS 选择器全部基于 `.art-root` / `.art-notebook` / `.art-chat` + `.art-article` 这两个 class 层级，不依赖任何特定的 HTML 结构（除了标准的 `h1-h6`、`p`、`ul`、`pre`、`code` 等 markdown 标签）。这就是为什么 CSS 不写 `.art-root > main > article > h1` 这种深层选择器 —— 一旦深了，消费者的 markdown 渲染器输出结构稍微不同就坏。

### 档位 2：样式 + rehype 管线

谁：Astro / Vite + `@mdx-js/rollup` / 任意 unified.js 用户。希望我们的 Shiki 主题、自定义块语法、code copy metadata。

接入面：`/styles.css` + `/rehype-shiki` + `/rehype-custom-blocks` + `/rehype-add-copy-content`。

设计约束：3 个 rehype 插件**纯 ESM**，没有 React/Next 依赖，没有 `process.cwd()` / `__dirname` 引用。可以被任何 unified 管线消费。每个插件只做一件事，可独立启用 —— 不用 CodeBlock 组件的消费者可以省掉 `rehype-add-copy-content`。

### 档位 3：样式 + rehype + React 组件

谁：Vite / Remix / TanStack Start / 任意 React 环境，希望复用 `CodeBlock` / `MermaidBlock` / `ArticleToc` / `ArticleLayoutBase` 的全套交互。

接入面：`/styles.css` + `/core` + `/rehype-*`（用自家 MDX 编译器把 .mdx 编译成 React 组件）。

设计约束：`ArticleLayoutBase` 接受 `linkComponent` prop（默认 `<a>`），任何路由库的 `<Link>` 都能注入。不强制 next/font；`fontClass` 默认空字符串，CSS 变量通过 fallback 链兜底。

### 顶档：Next.js + 我们的全套

谁：Next.js 应用，最省心的接入方式。

接入面：`prose-atelier`（顶层）+ `/route` + `/styles.css`。

```ts
// app/[...slug]/page.tsx
export { default, generateStaticParams, dynamicParams } from "prose-atelier/route";
```

加上 `app/layout.tsx` 里 `import "prose-atelier/styles.css"`。完了。

---

## 5. 类型系统定位

完整类型定义见 `src/types.ts`（实现前先写，作为设计契约）。这里只列**类型分类**：

### 5.1 数据类型（值的形状）

- `ArticleMeta` —— frontmatter 解析结果。所有版式组件的输入。
- `ArticleTheme` —— `"editorial" | "notebook" | "chat"` 字面量联合。决定走哪个分支。
- `ArticleDensity` —— `"xs" | "sm" | "md" | "lg"`。仅 chat 主题相关。

### 5.2 组件 props 类型

- `ArticleLinkProps` —— `linkComponent` 注入点的链接 prop 形状。设计成「足够宽以兼容 `<a>` / `next/link` / `react-router <Link>`」。
- `ArticleLayoutBaseProps` —— 框架无关版式入口的 props。
- `MDXArticleProps` —— Next.js 渲染器的 props。
- `CreateMdxRouteOptions` —— Next.js 路由助手的配置项。

### 5.3 公共扩展点类型

- `MDXComponentMap` —— `Record<string, ComponentType<any>>`，MDX 元素覆盖表。

### 5.4 类型的归属与重导出策略

**单一来源**：所有公共类型定义在 `src/types.ts`。

**重导出**：
- `src/article-layout-base.tsx` re-export `ArticleMeta`、`ArticleLayoutBaseProps` —— 让组件文件也能直接 import 类型，方便单独使用。
- `src/index.ts` re-export 所有顶层公共类型。
- `src/core.ts` re-export 所有框架无关类型。
- `src/route.tsx` re-export `CreateMdxRouteOptions`。

**为什么不直接散落在组件文件里**：当 `ArticleMeta` 同时被 `ArticleLayoutBase`、`MDXArticle`、`createMdxRoute` 三处消费，它就不是「Layout 的类型」了，是数据契约 —— 数据契约必须有显式归属。

---

## 6. 与 article-template 仓库的关系

```
article-template（本仓库的孪生项目）
├── 角色 1：prose-atelier 的 demo / 集成测试用例
└── 角色 2：prose-atelier 的视觉对照参照物
```

**单一源码路线**：早期计划里 `app/_mdx/` 与本包并存做 vendor-and-edit 逃生通道，已弃用并删除 —— 两份相同 CSS / 组件源码同时维护本身就是当初催生这个包的痛点。`article-template` 现在完全通过 `pnpm add prose-atelier` 接入，所有视觉与渲染逻辑的唯一源头都在本包。

**逃生通道**仍然存在，但路径变成了 git：要做深度定制的人 fork/clone 本仓库，改源码，自己发包 —— 比维护两份并行源码更干净。

**相互职责**：
- `prose-atelier` 仓库：NPM 发布、API 稳定性、向后兼容、所有源码。
- `article-template` 仓库：示例 MDX 内容、demo 组件（聊天 demo 等）、catchall 路由的真实接入示例。

---

## 7. 版本与兼容

- **0.x**：API 可破坏性调整。当前阶段不承诺向后兼容。
- **1.0 之后**：semver。Next major：删/重命名 export、改 ArticleMeta 必填字段、改 CSS 变量名。

CSS 变量名（`--art-*` / `--nb-*` / `--ch-*` / `--font-article-*`）算公开 API —— 改了要算 major。

---

## 8. 不做的扩展点（曾被考虑、刻意拒绝）

- **不提供 `theme` plugin 注册器**。三套主题已覆盖 95% 文章场景；要新主题就 vendor 一份改 CSS。
- **不提供 frontmatter schema 自定义**。`ArticleMeta` 是固定形状；自家额外字段读取由消费者自己取。
- **不提供 SSR / 流式渲染选项**。Next 走 RSC 默认行为，非 Next 走构建期 MDX 编译。
- **不提供 client-side MDX 编译**。包体积爆炸、安全面变大；要这么干的人会自己接 `mdx-bundler`。

---

## 9. 验收标准（任务完成的定义）

1. 包可 build：`pnpm build` 退出 0，`dist/` 含所有声明的 export。
2. `/core` 子路径无 Next 残留（grep 校验）。
3. 三个客户端组件 `dist/*.js` 首行仍为 `"use client";`。
4. `article-template` 通过 `pnpm add ../prose-atelier` 本地链接接入，`pnpm dev` 渲染：
   - `/example`（editorial）
   - `/example-notebook`（notebook）
   - 聊天 demo（chat）
   视觉与本仓库 main 分支一致。
5. README 三档教程的代码示例可直接复制运行（至少 Vite + React 这一档手工冒烟过）。

5 项全过 = 任务完成。GitHub 公开发布是另一个任务。
