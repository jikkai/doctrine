import assert from 'node:assert/strict'

import { renderToStaticMarkup } from 'react-dom/server'
import { test } from 'vitest'

import { MdxHeading2, MdxHeading3 } from '../heading.js'

test('creates stable heading anchors for table-of-contents links', () => {
  assert.equal(
    renderToStaticMarkup(<MdxHeading2>Getting started</MdxHeading2>),
    '<h2 id="getting-started">Getting started</h2>',
  )
  assert.equal(
    renderToStaticMarkup(<MdxHeading3>配置与主题</MdxHeading3>),
    '<h3 id="配置与主题">配置与主题</h3>',
  )
})
