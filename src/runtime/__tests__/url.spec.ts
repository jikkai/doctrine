import assert from 'node:assert/strict'

import { test } from 'vitest'

import {
  documentMarkdownPath,
  documentRouteFromMarkdownPath,
  documentRoutePath,
  withBase,
  withoutBase,
} from '../url.js'

test('keeps locale routes and links inside a deployment subpath', () => {
  assert.equal(documentRoutePath('en-US', 'en-US', 'guide/install'), '/guide/install/')
  assert.equal(documentRoutePath('zh-CN', 'en-US', 'guide/install'), '/zh-CN/guide/install/')
  assert.equal(withBase('/doctrine/', '/zh-CN/guide/install/'), '/doctrine/zh-CN/guide/install/')
  assert.equal(withoutBase('/doctrine/', '/doctrine/guide/install/'), '/guide/install/')
  assert.equal(withBase('/doctrine/', 'https://example.com'), 'https://example.com')
})

test('maps root, nested, and localized document routes to Markdown paths in both directions', () => {
  const paths = [
    { markdown: '/index.md', route: '/' },
    { markdown: '/index/index.md', route: '/index/' },
    { markdown: '/index/index/index.md', route: '/index/index/' },
    { markdown: '/guide/install.md', route: '/guide/install/' },
    { markdown: '/zh-CN/guide/install.md', route: '/zh-CN/guide/install/' },
  ]

  for (const { markdown, route } of paths) {
    assert.equal(documentMarkdownPath(route), markdown)
    assert.equal(documentRouteFromMarkdownPath(markdown), route)
  }
  assert.equal(documentRouteFromMarkdownPath('/guide/install/'), undefined)
  assert.equal(documentRouteFromMarkdownPath('/guide/install.md/'), undefined)
  assert.equal(documentRouteFromMarkdownPath('/guide//install.md'), undefined)
  assert.equal(documentRouteFromMarkdownPath('/.md'), undefined)
  assert.equal(documentRouteFromMarkdownPath('/foo/.md'), undefined)
  assert.equal(documentRouteFromMarkdownPath('/Index.md'), undefined)
})
