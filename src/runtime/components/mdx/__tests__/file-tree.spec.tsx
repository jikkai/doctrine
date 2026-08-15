import assert from 'node:assert/strict'

import { renderToStaticMarkup } from 'react-dom/server'
import { test } from 'vitest'

import { FileTree, FileTreeFile, FileTreeFolder } from '../file-tree.js'

test('renders a semantic nested file list and marks the current file', () => {
  const html = renderToStaticMarkup(
    <FileTree>
      <FileTreeFolder name="docs">
        <FileTreeFile active name="index.mdx" />
      </FileTreeFolder>
      <FileTreeFile name="package.json" />
    </FileTree>,
  )

  assert.match(html, /data-slot="file-tree"/)
  assert.match(html, /data-slot="file-tree-folder"[\s\S]*>docs<\/span>/)
  assert.match(html, /aria-current="true"[^>]*data-slot="file-tree-file"[\s\S]*>index\.mdx<\/span>/)
  assert.match(html, /data-slot="file-tree-file"[\s\S]*>package\.json<\/span>/)
})
