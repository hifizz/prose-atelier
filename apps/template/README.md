# article-template (demo app)

The live demo for [`prose-atelier`](../../packages/prose-atelier/). What you
see here is also the package's integration test — every change to the package
gets exercised by this app before publish.

> Looking for the package docs / API / non-Next.js usage?
> → [`packages/prose-atelier/README.md`](../../packages/prose-atelier/README.md)

> Looking for the project overview / install / quick start?
> → [Root README](../../README.md)

## Run it

From the **repo root**:

```bash
pnpm install
pnpm dev
# http://localhost:3090
```

## What's inside

```
app/
├── layout.tsx            root HTML shell, imports the package stylesheet
├── page.tsx              the homepage you see in the hero shot
├── [...slug]/page.tsx    catchall MDX route (uses createMdxRoute)
└── _demos/               project-specific React components (Demo, TickingDot…)
                          made available inside MDX by name
content/
├── example.mdx           editorial theme — every primitive
├── example-notebook.mdx  notebook theme
└── example-chat.mdx      chat theme + density switcher
```

The catchall route is just:

```ts
// app/[...slug]/page.tsx
import * as demos from "@/app/_demos";
import { createMdxRoute } from "prose-atelier/route";

const route = createMdxRoute({ components: demos });
export default route.Page;
export const generateStaticParams = route.generateStaticParams;
export const dynamicParams = false;
```

That's the whole pipeline. Add a `.mdx` file under `content/`, it's reachable
at the matching slug, no further wiring needed.

## Editing the package while running the demo

The app links to the package via pnpm workspace (`"prose-atelier": "workspace:*"`),
so changes in `packages/prose-atelier/src/` flow into the demo as soon as the
package is rebuilt:

```bash
# in another terminal
pnpm dev:pkg    # watch-rebuild the package
```

CSS changes need a re-run of `pnpm --filter prose-atelier build:css` (not in
watch mode by default — small enough to be fine).

## License

[MIT](./LICENSE) — same as the repo root.
