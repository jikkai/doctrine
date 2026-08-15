import assert from 'node:assert/strict'

import { renderToStaticMarkup } from 'react-dom/server'
import { test } from 'vitest'

import { CodeBlock, CodeBlockPre } from '../code-block.js'
import { DoctrineLocaleContext } from '../context.js'

test('renders a localized code block toolbar with filename and language', () => {
  const html = renderToStaticMarkup(
    <DoctrineLocaleContext value="zh-CN">
      <CodeBlock filename="doctrine.config.ts">
        <CodeBlockPre className="shiki language-ts">
          <code>export default {'{}'}</code>
        </CodeBlockPre>
      </CodeBlock>
    </DoctrineLocaleContext>,
  )

  assert.match(html, /data-slot="code-block"/)
  assert.match(html, /data-slot="code-block-filename"[^>]*>doctrine\.config\.ts/)
  assert.match(html, /data-slot="code-block-language">TypeScript/)
  assert.match(html, /aria-label="复制代码"/)
  assert.doesNotMatch(html, />复制代码</)
  assert.match(html, /export default \{\}/)
})
