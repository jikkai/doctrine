import assert from 'node:assert/strict'

import { test } from 'vitest'

import type { IGeneratedDocument, IRuntimeConfig } from '../types.js'
import { createDocumentRoutes } from '../content.js'

const config: IRuntimeConfig = {
  base: '/',
  description: 'Site fallback',
  dev: false,
  githubSourceRoot: 'docs',
  githubUrl: 'https://github.com/amamo/doctrine.git',
  locales: { default: 'en', names: ['en'] },
  navigation: {
    en: [
      {
        description: 'Localized navigation description',
        documentKey: 'en:landing',
        sourcePath: 'guides/landing.mdx',
        title: 'Landing',
        type: 'page',
      },
    ],
  },
  pageActions: true,
  siteUrl: 'https://example.com/',
  title: 'Documentation',
}

function document(frontmatter: Readonly<Record<string, unknown>>): IGeneratedDocument {
  return {
    derived: {},
    frontmatter,
    key: 'en:landing',
    load: async () => ({ default: () => null }),
    slug: '/landing/',
    standalone: true,
  }
}

test('uses locale navigation metadata when a page has no description', () => {
  const [navigationRoute] = createDocumentRoutes([document({})], config)
  const [frontmatterRoute] = createDocumentRoutes(
    [document({ description: 'Frontmatter description' })],
    config,
  )

  assert.equal(navigationRoute?.description, 'Localized navigation description')
  assert.equal(frontmatterRoute?.description, 'Frontmatter description')
})

test('maps localized MDX files to Markdown and repository source actions', () => {
  const localizedConfig: IRuntimeConfig = {
    ...config,
    locales: { default: 'en', names: ['en', 'zh-CN'] },
    navigation: {
      ...config.navigation,
      'zh-CN': [
        {
          documentKey: 'zh-CN:landing',
          sourcePath: 'guides/landing.zh-CN.mdx',
          title: '登陆页',
          type: 'page',
        },
      ],
    },
  }
  const localizedDocument: IGeneratedDocument = {
    ...document({}),
    key: 'zh-CN:landing',
    locale: 'zh-CN',
  }

  const routes = createDocumentRoutes([document({}), localizedDocument], localizedConfig)

  assert.deepEqual(
    routes.map((route) => route.source),
    [
      {
        githubUrl: 'https://github.com/amamo/doctrine/blob/HEAD/docs/guides/landing.mdx',
        markdownPath: '/landing.md',
        sourcePath: 'guides/landing.mdx',
      },
      {
        githubUrl: 'https://github.com/amamo/doctrine/blob/HEAD/docs/guides/landing.zh-CN.mdx',
        markdownPath: '/zh-CN/landing.md',
        sourcePath: 'guides/landing.zh-CN.mdx',
      },
    ],
  )

  const [monorepoRoute] = createDocumentRoutes([document({})], {
    ...config,
    githubSourceRoot: 'packages/site/docs',
  })
  assert.equal(
    monorepoRoute?.source?.githubUrl,
    'https://github.com/amamo/doctrine/blob/HEAD/packages/site/docs/guides/landing.mdx',
  )
})

test('keeps Markdown actions independent from repository links and allows disabling them', () => {
  const [withoutRepository] = createDocumentRoutes([document({})], {
    ...config,
    githubUrl: undefined,
  })
  const [disabled] = createDocumentRoutes([document({})], { ...config, pageActions: false })

  assert.deepEqual(withoutRepository?.source, {
    markdownPath: '/landing.md',
    sourcePath: 'guides/landing.mdx',
  })
  assert.equal(disabled?.source, undefined)
})

test('rejects Markdown files that collide with document output directories', () => {
  const collisionConfig: IRuntimeConfig = {
    ...config,
    navigation: {
      en: [
        {
          documentKey: 'en:foo',
          sourcePath: 'foo.mdx',
          title: 'Foo',
          type: 'page',
        },
        {
          documentKey: 'en:foo.md',
          sourcePath: 'foo.md.mdx',
          title: 'Foo Markdown',
          type: 'page',
        },
      ],
    },
  }
  const documents: IGeneratedDocument[] = [
    { ...document({}), key: 'en:foo', slug: '/foo/' },
    { ...document({}), key: 'en:foo.md', slug: '/foo.md/' },
  ]

  assert.throws(
    () => createDocumentRoutes(documents, collisionConfig),
    /Markdown output for \/foo\/ at foo\.md conflicts with HTML output for \/foo\.md\/ at foo\.md\/index\.html/,
  )
})

test('rejects document routes that collide with fixed and reserved outputs', () => {
  const collisions = [
    {
      error:
        /HTML output for \/404\.html\/ at 404\.html\/index\.html conflicts with HTML output for the not-found fallback at 404\.html/,
      page: '404.html',
    },
    {
      error:
        /HTML output for \/\.vite\/ at \.vite\/index\.html conflicts with reserved output for Vite metadata at \.vite/,
      page: '.vite',
    },
    {
      error:
        /HTML output for \/pagefind\/ at pagefind\/index\.html conflicts with reserved output for Pagefind search assets at pagefind/,
      page: 'pagefind',
    },
  ]

  for (const { error, page } of collisions) {
    const collisionConfig: IRuntimeConfig = {
      ...config,
      navigation: {
        en: [
          {
            documentKey: `en:${page}`,
            sourcePath: `${page}.mdx`,
            title: 'Conflicting page',
            type: 'page',
          },
        ],
      },
    }
    const collisionDocument = { ...document({}), key: `en:${page}`, slug: `/${page}/` }

    assert.throws(() => createDocumentRoutes([collisionDocument], collisionConfig), error)
  }
})
