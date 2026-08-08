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
# My documentation

The first page is ready.
```

Create the navigation for the default locale in `docs/meta.ts`:

```ts
import { defineDirectory } from '@amamo/doctrine'

export default defineDirectory({
  items: [{ page: 'index', title: 'My documentation' }],
})
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
  githubUrl: 'https://github.com/acme/my-project',
  copyright: 'Copyright © 2026 Acme.',
  iconLibrary: 'lucide-react',
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
docs/meta.ts
docs/index.zh-CN.mdx
docs/meta.zh-CN.ts
docs/guide/install.mdx
docs/guide/meta.ts
docs/guide/install.zh-CN.mdx
docs/guide/meta.zh-CN.ts
```

The default locale uses `/guide/install/`; the translated page uses
`/zh-CN/guide/install/`. Each locale file owns the titles, icons, and array order for the MDX files
and child directories beside it.

## Documentation

- [Getting started](https://jikkai.github.io/doctrine/guide/getting-started/)
- [Features](https://jikkai.github.io/doctrine/features/)
- [Customization](https://jikkai.github.io/doctrine/customization/)
- [Configuration](https://jikkai.github.io/doctrine/configuration/)
- [CLI reference](https://jikkai.github.io/doctrine/cli/)
- [GitHub Pages deployment](https://jikkai.github.io/doctrine/deployment/)
