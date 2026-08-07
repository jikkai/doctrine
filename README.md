# @amamo/doctrine

Turn an MDX directory into a static React documentation site. Doctrine provides Vite-powered
development, static generation, Pagefind search, localization, light and dark themes, custom React
components, built-in MDX components, and subpath-safe deployment.

## Quick start

Doctrine requires Node.js 20.19 or newer.

```sh
pnpm add @amamo/doctrine
mkdir docs
```

Create `docs/index.mdx`:

```mdx
---
title: My documentation
description: Product guides and API notes.
---

# My documentation

The first page is ready.
```

Start the development server:

```sh
pnpm exec doctrine dev docs
```

Build static files with the final public URL:

```sh
pnpm exec doctrine build docs --site-url https://example.com/project/
```

The output is written to `dist` by default.

## Configuration

Add `doctrine.config.ts` at the project root:

```ts
import { defineConfig } from '@amamo/doctrine'

export default defineConfig({
  title: 'My project',
  description: 'Guides for My project.',
  locales: {
    default: 'en',
    names: ['en', 'zh-CN'],
    labels: { en: 'English', 'zh-CN': '简体中文' },
  },
  components: './docs/components.tsx',
  styles: './docs/theme.css',
})
```

Locale variants follow the `@amamo/mdx` filename convention:

```text
docs/index.mdx
docs/index.zh-CN.mdx
docs/guide/install.mdx
docs/guide/install.zh-CN.mdx
```

The default locale uses `/guide/install/`; the translated page uses
`/zh-CN/guide/install/`.

## Documentation

- [Getting started](https://jikkai.github.io/doctrine/guide/getting-started/)
- [Features](https://jikkai.github.io/doctrine/features/)
- [Customization](https://jikkai.github.io/doctrine/customization/)
- [Configuration](https://jikkai.github.io/doctrine/configuration/)
- [CLI reference](https://jikkai.github.io/doctrine/cli/)
- [GitHub Pages deployment](https://jikkai.github.io/doctrine/deployment/)
