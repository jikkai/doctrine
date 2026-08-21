import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { test } from 'vitest'

import { loadDoctrineNavigation } from '../navigation.js'

test('loads ordered navigation from the nearest locale config', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'doctrine-navigation-'))
  const docs = path.join(root, 'docs')
  try {
    await mkdir(path.join(docs, 'guide'), { recursive: true })
    await Promise.all([
      writeFile(path.join(root, 'package.json'), JSON.stringify({ type: 'module' })),
      writeFile(path.join(docs, 'index.mdx'), '# Home\n'),
      writeFile(path.join(docs, 'index.zh-CN.mdx'), '# 首页\n'),
      writeFile(
        path.join(docs, 'landing.tsx'),
        'export default function Landing() { return <h1>Landing</h1> }\n',
      ),
      writeFile(
        path.join(docs, 'component.tsx'),
        'export function Component() { return <span>Component</span> }\n',
      ),
      writeFile(path.join(docs, 'guide/start.mdx'), '# Start\n'),
      writeFile(path.join(docs, 'guide/start.zh-CN.mdx'), '# 开始\n'),
      writeFile(
        path.join(docs, 'meta.ts'),
        "export default { items: [{ directory: 'guide' }, { page: 'index', title: 'Home', icon: 'House' }, { page: 'landing', title: 'Landing', description: 'Standalone page' }] }\n",
      ),
      writeFile(
        path.join(docs, 'meta.zh-CN.ts'),
        "export default { items: [{ page: 'index', title: '首页' }, { directory: 'guide' }] }\n",
      ),
      writeFile(
        path.join(docs, 'guide/meta.ts'),
        "export default { title: 'Guide', items: [{ page: 'start', title: 'Start' }] }\n",
      ),
      writeFile(
        path.join(docs, 'guide/meta.zh-CN.ts'),
        "export default { title: '指南', items: [{ page: 'start', title: '开始' }] }\n",
      ),
    ])

    const result = await loadDoctrineNavigation({
      command: 'build',
      contentDirectory: docs,
      locales: { default: 'en', names: ['en', 'zh-CN'] },
      root,
    })

    assert.deepEqual(result.icons, ['House'])
    assert.deepEqual(result.navigation, {
      en: [
        {
          directory: 'guide',
          items: [
            {
              documentKey: 'en:guide/start',
              sourcePath: 'guide/start.mdx',
              title: 'Start',
              type: 'page',
            },
          ],
          title: 'Guide',
          type: 'directory',
        },
        {
          documentKey: 'en:/',
          icon: 'House',
          sourcePath: 'index.mdx',
          title: 'Home',
          type: 'page',
        },
        {
          description: 'Standalone page',
          documentKey: 'en:landing',
          title: 'Landing',
          type: 'page',
        },
      ],
      'zh-CN': [
        {
          documentKey: 'zh-CN:/',
          sourcePath: 'index.zh-CN.mdx',
          title: '首页',
          type: 'page',
        },
        {
          directory: 'guide',
          items: [
            {
              documentKey: 'zh-CN:guide/start',
              sourcePath: 'guide/start.zh-CN.mdx',
              title: '开始',
              type: 'page',
            },
          ],
          title: '指南',
          type: 'directory',
        },
      ],
    })
    assert.deepEqual(result.tsxPages, [
      {
        documentKey: 'en:landing',
        file: path.join(docs, 'landing.tsx'),
        locale: 'en',
        slug: '/landing/',
      },
    ])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})
