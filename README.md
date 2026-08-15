# @amamo/doctrine

Build an MDX directory into a static React documentation site. Doctrine provides a Vite development
server, prerendered HTML, Pagefind search, localized navigation, light and dark themes, and
subpath-safe assets without requiring a production Node.js server.

## Requirements

- Node.js 20.19 or newer.
- A [native target supported by `@amamo/mdx`](https://jikkai.github.io/mdx/native-targets/).
  Doctrine has no JavaScript fallback for MDX compilation.
- Trusted content and configuration authors. MDX, referenced TSX pages, config files, navigation
  files, and custom components can execute JavaScript during the build.

## Quick start

Install Doctrine with your package manager:

| Package manager | Command                       |
| --------------- | ----------------------------- |
| pnpm            | `pnpm add @amamo/doctrine`    |
| npm             | `npm install @amamo/doctrine` |
| yarn            | `yarn add @amamo/doctrine`    |
| bun             | `bun add @amamo/doctrine`     |

Then create the content directory:

```sh
mkdir docs
```

Create `docs/index.mdx`:

```mdx
# My documentation

The first page is ready.
```

Create `docs/meta.ts` to make the page part of the navigation:

```ts
import { defineDirectory } from '@amamo/doctrine'

export default defineDirectory({
  items: [{ page: 'index', title: 'My documentation' }],
})
```

Preview and build:

```sh
doctrine dev docs
doctrine build docs --site-url https://example.com/project/
```

Development defaults to `http://localhost:5173`. Production output defaults to `dist`; pass the
real public URL so assets, canonical links, locale routes, search results, and `404.html` use the
correct deployment base.

## Configuration

`doctrine.config.ts` is optional. Add it at the project root when the defaults are not enough:

```ts
import { defineConfig } from '@amamo/doctrine'

export default defineConfig({
  title: 'My project',
  description: 'Guides for My project.',
  githubUrl: 'https://github.com/your-org/my-project',
  copyright: 'Copyright © 2026 Your organization.',
  locales: {
    default: 'en',
    names: ['en', 'zh-CN'],
    labels: { en: 'English', 'zh-CN': '简体中文' },
  },
})
```

Locale variants use filename suffixes. Every directory with content for a locale also has the
matching navigation module:

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
`/zh-CN/guide/install/`. Navigation modules own page titles, icons, child directories, and order.

A page entry can also name a same-directory `.tsx` file. Only TSX files listed by the matching
locale navigation module become routes; every other TSX file remains an ordinary component. These
pages render inside Doctrine's header and footer without the documentation sidebar, prose layout,
or table of contents.

## What the build does

```text
CLI + doctrine.config.* + meta*.ts
  -> normalize paths, URLs, locales, and navigation
  -> Vite + @amamo/mdx compile content and client/SSR bundles
  -> React prerenders every navigation route
  -> Doctrine writes HTML, assets, and 404.html
  -> Pagefind indexes the final HTML
```

Doctrine keeps the generated content registry and cache records in `.amamo-mdx/`, and temporary
build work in `.doctrine/`. Treat both as generated directories and keep them out of version control.

## Package surfaces

| Import                       | Public API                                                              |
| ---------------------------- | ----------------------------------------------------------------------- |
| `@amamo/doctrine`            | `defineConfig`, `defineDirectory`, and their public configuration types |
| `@amamo/doctrine/components` | Built-in MDX components, including `LivePreview`, `FileTree`, and tabs  |
| `doctrine`                   | `dev` and `build` CLI commands                                          |

## Documentation

- [Getting started](https://jikkai.github.io/doctrine/getting-started/)
- [Features and runtime behavior](https://jikkai.github.io/doctrine/features/)
- [Customization](https://jikkai.github.io/doctrine/customization/)
- [MDX components](https://jikkai.github.io/doctrine/mdx-components/)
- [Configuration](https://jikkai.github.io/doctrine/configuration/)
- [CLI reference](https://jikkai.github.io/doctrine/cli/)
- [GitHub Pages deployment](https://jikkai.github.io/doctrine/deployment/)

See [CONTRIBUTING.md](./CONTRIBUTING.md) to work on Doctrine itself.

## License

MIT
