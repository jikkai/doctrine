import assert from 'node:assert/strict'

import { test } from 'vitest'

import type { IGeneratedDocument, IRuntimeConfig } from '../types.js'
import { createDocumentRoutes } from '../content.js'

const config: IRuntimeConfig = {
  base: '/',
  description: 'Site fallback',
  dev: false,
  locales: { default: 'en', names: ['en'] },
  navigation: {
    en: [
      {
        description: 'Localized navigation description',
        documentKey: 'en:landing',
        title: 'Landing',
        type: 'page',
      },
    ],
  },
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
