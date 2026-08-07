# @amamo/doctrine

Build a static React documentation site from an MDX directory. Doctrine uses Vite for SSR and client assets, `@amamo/mdx` for content, Pagefind for search, and shadcn-style Base UI components with Tailwind CSS.

## Usage

```sh
pnpm add @amamo/doctrine
pnpm exec doctrine dev docs
pnpm exec doctrine build docs --site-url https://example.com/project/
```

Every document requires a `title` in its frontmatter. `description` and numeric `order` are optional.

## Configuration

Add `doctrine.config.ts` when the site needs metadata or multiple locales:

```ts
import { defineConfig } from "@amamo/doctrine";

export default defineConfig({
  components: "./docs/components.tsx",
  title: "My project",
  locales: {
    default: "en",
    names: ["en", "zh-CN"],
    labels: { en: "English", "zh-CN": "简体中文" },
  },
});
```

The component module exports an MDX component map. It is bundled for both static rendering and
client hydration, and its Tailwind classes are scanned automatically:

```tsx
import type { IDoctrineComponents } from "@amamo/doctrine";
import type { ReactNode } from "react";

function Callout({ children }: { children: ReactNode }) {
  return <aside className="rounded-lg border p-4">{children}</aside>;
}

export default { Callout } satisfies IDoctrineComponents;
```

Registered components can be used directly in any document:

```mdx
<Callout>Remember to set the final site URL before building.</Callout>
```

Locale variants use the `@amamo/mdx` filename convention:

```text
docs/index.mdx
docs/index.zh-CN.mdx
docs/guide/install.mdx
docs/guide/install.zh-CN.mdx
```

The default locale is served at `/guide/install/`; other locales are served at `/zh-CN/guide/install/`. A language option is shown only when that translation exists.

## GitHub Pages

Pass the final absolute Pages URL to the build. Its pathname becomes Vite's base without nesting the output directory:

```sh
pnpm exec doctrine build docs \
  --site-url https://user.github.io/repository/
```

Use `actions/configure-pages` before the build and pass `${{ steps.pages.outputs.base_url }}`. See [the included workflow](.github/workflows/deploy-pages.yml).
