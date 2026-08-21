import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { test } from 'vitest'

import { normalizeDoctrineConfig } from '../config.js'

test('normalizes inferred and explicit repository source roots', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'doctrine-config-'))
  const docs = path.join(root, 'docs')

  try {
    await mkdir(docs)
    await writeFile(path.join(docs, 'index.mdx'), '# Home\n')
    await writeFile(
      path.join(docs, 'meta.ts'),
      "export default { items: [{ page: 'index', title: 'Home' }] }\n",
    )

    const inferred = await normalizeDoctrineConfig(
      {},
      { command: 'serve', contentDirectory: 'docs', root },
    )
    const explicit = await normalizeDoctrineConfig(
      { githubSourceRoot: 'packages\\site\\docs' },
      { command: 'serve', contentDirectory: 'docs', root },
    )

    assert.equal(inferred.githubSourceRoot, 'docs')
    assert.equal(explicit.githubSourceRoot, 'packages/site/docs')
    await assert.rejects(
      normalizeDoctrineConfig(
        { githubSourceRoot: '../docs' },
        { command: 'serve', contentDirectory: 'docs', root },
      ),
      /githubSourceRoot must be a repository-relative path/,
    )
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})
