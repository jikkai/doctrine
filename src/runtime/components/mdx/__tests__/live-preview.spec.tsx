import assert from 'node:assert/strict'

import { renderToStaticMarkup } from 'react-dom/server'
import { test } from 'vitest'

import { DoctrineLocaleContext } from '../context.js'
import { LivePreview } from '../live-preview.js'

test('renders a preview with localized source disclosure', () => {
  const html = renderToStaticMarkup(
    <DoctrineLocaleContext value="zh-CN">
      <LivePreview source="<button>保存</button>" title="按钮">
        <button type="button">保存</button>
      </LivePreview>
    </DoctrineLocaleContext>,
  )

  assert.match(html, /data-slot="live-preview"/)
  assert.match(html, /data-slot="live-preview-title">按钮/)
  assert.match(html, /data-slot="live-preview-canvas"[^>]*><button type="button">保存<\/button>/)
  assert.match(html, /data-slot="live-preview-code-toggle"[^>]*>[\s\S]*源码/)
  assert.match(html, /data-slot="live-preview-source"/)
  assert.match(html, /&lt;button&gt;保存&lt;\/button&gt;/)
})
