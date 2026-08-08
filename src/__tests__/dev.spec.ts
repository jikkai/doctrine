import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
import type { ViteDevServer } from 'vite'
import { test } from 'vitest'
import { normalizeDoctrineConfig } from '../config.js'
import { dev } from '../dev.js'

test('refreshes navigation metadata and MDX routes without restarting', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'doctrine-dev-'))
  const docs = path.join(root, 'docs')
  let server: ViteDevServer | undefined

  try {
    await mkdir(docs)
    await symlink(
      path.join(process.cwd(), 'node_modules'),
      path.join(root, 'node_modules'),
      'junction',
    )
    await Promise.all([
      writeFile(path.join(root, 'package.json'), JSON.stringify({ type: 'module' })),
      writeFile(path.join(docs, 'index.mdx'), '# Home\n'),
      writeFile(path.join(docs, 'remove.mdx'), '# Remove\n'),
      writeFile(
        path.join(docs, 'meta.ts'),
        "export default { items: [{ page: 'index', title: 'Home', icon: 'House' }, { page: 'remove', title: 'Remove' }] }\n",
      ),
    ])

    const config = await normalizeDoctrineConfig(
      { iconLibrary: 'lucide-react' },
      { command: 'serve', contentDirectory: 'docs', root },
    )
    server = await dev(config, { host: '127.0.0.1', port: 0 })
    const address = server.httpServer?.address()
    assert.ok(address && typeof address !== 'string')
    const origin = `http://127.0.0.1:${address.port}`

    const initial = await fetch(`${origin}/`)
    assert.equal(initial.status, 200)
    assert.match(await initial.text(), /<span>Home<\/span>/)

    await writeFile(
      path.join(docs, 'meta.ts'),
      "export default { items: [{ page: 'remove', title: 'Keep briefly' }, { page: 'index', title: 'Updated', icon: 'BookOpen' }] }\n",
    )
    const updated = await waitForPage(origin, '/', (response) => {
      return (
        response.status === 200 &&
        response.body.includes('<span>Updated</span>') &&
        response.body.includes('lucide-book-open') &&
        response.body.indexOf('<span>Keep briefly</span>') <
          response.body.indexOf('<span>Updated</span>')
      )
    })
    assert.doesNotMatch(updated.body, /lucide-house/)

    await writeFile(path.join(docs, 'added.mdx'), '# Added\n')
    await waitForFile(path.join(root, '.amamo-mdx/collections.mjs'), (contents) => {
      return contents.includes('added.mdx')
    })
    const pendingAddition = await waitForPage(origin, '/', (response) => response.status === 200)
    assert.doesNotMatch(pendingAddition.body, /<span>Added<\/span>/)
    await writeFile(
      path.join(docs, 'meta.ts'),
      "export default { items: [{ page: 'index', title: 'Updated', icon: 'BookOpen' }, { page: 'added', title: 'Added' }, { page: 'remove', title: 'Remove' }] }\n",
    )
    await waitForPage(origin, '/added/', (response) => {
      return response.status === 200 && response.body.includes('<span>Added</span>')
    })

    await writeFile(
      path.join(docs, 'meta.ts'),
      "export default { items: [{ page: 'index', title: 'Updated', icon: 'BookOpen' }, { page: 'added', title: 'Added' }] }\n",
    )
    await waitForPage(origin, '/', (response) => {
      return response.status === 200 && !response.body.includes('<span>Remove</span>')
    })
    await rm(path.join(docs, 'remove.mdx'))
    await waitForPage(origin, '/', (response) => {
      return response.status === 200 && !response.body.includes('<span>Remove</span>')
    })
    await waitForPage(origin, '/remove/', (response) => response.status === 404)
  } finally {
    await server?.close()
    await rm(root, { force: true, recursive: true })
  }
}, 30_000)

async function waitForPage(
  origin: string,
  pathname: string,
  matches: (response: { body: string; status: number }) => boolean,
): Promise<{ body: string; status: number }> {
  const deadline = Date.now() + 5_000
  let response = { body: '', status: 0 }

  async function poll(): Promise<{ body: string; status: number }> {
    try {
      const result = await fetch(`${origin}${pathname}`)
      response = { body: await result.text(), status: result.status }
      if (matches(response)) return response
    } catch {
      // The server can briefly reject a request while two related files are being saved.
    }
    if (Date.now() >= deadline) {
      assert.fail(`Timed out waiting for ${pathname}; last status was ${response.status}`)
    }
    await delay(50)
    return poll()
  }

  return poll()
}

async function waitForFile(file: string, matches: (contents: string) => boolean): Promise<void> {
  const deadline = Date.now() + 5_000

  async function poll(): Promise<void> {
    try {
      if (matches(await readFile(file, 'utf8'))) return
    } catch {
      // The generated module may not exist until the first content update completes.
    }
    if (Date.now() >= deadline) assert.fail(`Timed out waiting for ${file}`)
    await delay(50)
    return poll()
  }

  return poll()
}
