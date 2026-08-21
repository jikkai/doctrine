import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
import type { ViteDevServer } from 'vite'
import { test } from 'vitest'
import { normalizeDoctrineConfig } from '../config.js'
import { dev } from '../dev.js'

function hasNavigationLink(html: string, href: string, label: string): boolean {
  const navigationStart = html.indexOf('data-slot="navigation"')
  if (navigationStart === -1) return false
  const navigationEnd = html.indexOf('</nav>', navigationStart)
  if (navigationEnd === -1) return false
  const navigation = html.slice(navigationStart, navigationEnd)
  const linkStart = navigation.indexOf(`href="${href}"`)
  if (linkStart === -1) return false
  const linkContentStart = navigation.indexOf('>', linkStart)
  if (linkContentStart === -1) return false
  const linkEnd = navigation.indexOf('</a>', linkStart)
  if (linkEnd === -1) return false
  const linkText = navigation
    .slice(linkContentStart + 1, linkEnd)
    .replaceAll(/<[^>]+>/g, '')
    .trim()
  return linkText === label
}

test('refreshes navigation metadata and MDX routes without restarting', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'doctrine-dev-'))
  const docs = path.join(root, 'docs')
  let server: ViteDevServer | undefined

  try {
    const initialSource = '# Home\n\nInitial Markdown bytes.\n'
    const updatedSource = '# Home\n\nUpdated Markdown bytes.\n'
    const indexRouteSource = '# Index route\n'
    await mkdir(path.join(docs, 'index'), { recursive: true })
    await mkdir(path.join(root, 'public'))
    await symlink(
      path.join(process.cwd(), 'node_modules'),
      path.join(root, 'node_modules'),
      'junction',
    )
    await Promise.all([
      writeFile(path.join(root, 'package.json'), JSON.stringify({ type: 'module' })),
      writeFile(path.join(docs, 'index.mdx'), initialSource),
      writeFile(path.join(docs, 'index/page.mdx'), indexRouteSource),
      writeFile(
        path.join(docs, 'index/meta.ts'),
        "export default { title: 'Index', items: [{ page: 'page', title: 'Index route' }] }\n",
      ),
      writeFile(path.join(docs, 'legal.md.mdx'), '# Legal page\n'),
      writeFile(path.join(docs, 'remove.mdx'), '# Remove\n'),
      writeFile(path.join(root, 'public/license.md'), 'Public Markdown asset.\n'),
      writeFile(
        path.join(docs, 'meta.ts'),
        "export default { items: [{ page: 'index', title: 'Home', icon: 'House' }, { page: 'legal.md', title: 'Legal' }, { directory: 'index' }, { page: 'remove', title: 'Remove' }] }\n",
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
    const initialHtml = await initial.text()
    const initialMarkdown = await fetch(`${origin}/index.md`)
    assert.equal(initialMarkdown.status, 200)
    assert.equal(initialMarkdown.headers.get('content-type'), 'text/markdown; charset=utf-8')
    assert.equal(await initialMarkdown.text(), initialSource)

    const markdownHead = await fetch(`${origin}/index.md`, { method: 'HEAD' })
    assert.equal(markdownHead.status, 200)
    assert.equal(markdownHead.headers.get('content-type'), 'text/markdown; charset=utf-8')
    assert.equal(await markdownHead.text(), '')

    const indexMarkdown = await fetch(`${origin}/index/index.md`)
    assert.equal(indexMarkdown.status, 200)
    assert.equal(await indexMarkdown.text(), indexRouteSource)

    const dottedHtmlRoute = await fetch(`${origin}/legal.md/`)
    assert.equal(dottedHtmlRoute.status, 200)
    assert.match(await dottedHtmlRoute.text(), /<h1>Legal page<\/h1>/)

    const publicMarkdown = await fetch(`${origin}/license.md`)
    assert.equal(publicMarkdown.status, 200)
    assert.equal(await publicMarkdown.text(), 'Public Markdown asset.\n')

    const missingMarkdown = await fetch(`${origin}/missing.md`)
    assert.equal(missingMarkdown.status, 404)

    await writeFile(path.join(docs, 'index.mdx'), updatedSource)
    await waitForPage(origin, '/index.md', (response) => {
      return response.status === 200 && response.body === updatedSource
    })
    assert.equal(hasNavigationLink(initialHtml, '/remove/', 'Remove'), true)
    assert.match(initialHtml, /<link rel="stylesheet" href="\/@fs\/[^"]+\/runtime\/styles\.css">/)

    await writeFile(
      path.join(docs, 'meta.ts'),
      "export default { items: [{ page: 'remove', title: 'Keep briefly', icon: 'BookOpen' }, { page: 'index', title: 'Home' }] }\n",
    )
    const updated = await waitForPage(origin, '/', (response) => {
      return (
        response.status === 200 &&
        hasNavigationLink(response.body, '/remove/', 'Keep briefly') &&
        response.body.includes('lucide-book-open')
      )
    })
    assert.doesNotMatch(updated.body, /lucide-house/)

    await writeFile(path.join(docs, 'added.mdx'), '# Added\n')
    await waitForFile(path.join(root, '.amamo-mdx/collections.mjs'), (contents) => {
      return contents.includes('added.mdx')
    })
    const pendingAddition = await waitForPage(origin, '/', (response) => response.status === 200)
    assert.equal(hasNavigationLink(pendingAddition.body, '/added/', 'Added'), false)
    await writeFile(
      path.join(docs, 'meta.ts'),
      "export default { items: [{ page: 'index', title: 'Home' }, { page: 'added', title: 'Added' }, { page: 'remove', title: 'Keep briefly', icon: 'BookOpen' }] }\n",
    )
    await waitForPage(origin, '/added/', (response) => {
      return response.status === 200 && hasNavigationLink(response.body, '/added/', 'Added')
    })

    await writeFile(
      path.join(docs, 'meta.ts'),
      "export default { items: [{ page: 'index', title: 'Home' }, { page: 'added', title: 'Added' }] }\n",
    )
    await waitForPage(origin, '/', (response) => {
      return (
        response.status === 200 && !hasNavigationLink(response.body, '/remove/', 'Keep briefly')
      )
    })
    await rm(path.join(docs, 'remove.mdx'))
    await waitForPage(origin, '/', (response) => {
      return (
        response.status === 200 && !hasNavigationLink(response.body, '/remove/', 'Keep briefly')
      )
    })
    await waitForPage(origin, '/remove/', (response) => response.status === 404)
  } finally {
    await server?.close()
    await rm(root, { force: true, maxRetries: 5, recursive: true, retryDelay: 50 })
  }
}, 30_000)

test('rejects public files that collide with generated Markdown routes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'doctrine-dev-public-conflict-'))
  const docs = path.join(root, 'docs')

  try {
    await mkdir(docs)
    await mkdir(path.join(root, 'public'))
    await symlink(
      path.join(process.cwd(), 'node_modules'),
      path.join(root, 'node_modules'),
      'junction',
    )
    await Promise.all([
      writeFile(path.join(root, 'package.json'), JSON.stringify({ type: 'module' })),
      writeFile(path.join(docs, 'index.mdx'), '# Home\n'),
      writeFile(
        path.join(docs, 'meta.ts'),
        "export default { items: [{ page: 'index', title: 'Home' }] }\n",
      ),
      writeFile(path.join(root, 'public/index.md'), 'Public conflict.\n'),
    ])
    const config = await normalizeDoctrineConfig(
      {},
      { command: 'serve', contentDirectory: 'docs', root },
    )

    await assert.rejects(
      dev(config, { host: '127.0.0.1', port: 0 }),
      /Markdown route \/index\.md conflicts with public output index\.md/,
    )
  } finally {
    await rm(root, { force: true, maxRetries: 5, recursive: true, retryDelay: 50 })
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
