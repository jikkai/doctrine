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
  title: "My project",
  locales: {
    default: "en",
    names: ["en", "zh-CN"],
    labels: { en: "English", "zh-CN": "简体中文" },
  },
});
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
