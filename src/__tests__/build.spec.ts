import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { promisify } from 'node:util'
import path from 'node:path'

import { test } from 'vitest'

const execFileAsync = promisify(execFile)

test('builds localized static pages and search below a GitHub Pages subpath', async () => {
  const root = process.cwd()
  const outDir = path.join(root, '.doctrine-test-dist')
  try {
    await execFileAsync(
      process.execPath,
      [
        path.join(root, 'dist/cli.js'),
        'build',
        'docs',
        '--out-dir',
        '.doctrine-test-dist',
        '--site-url',
        'https://example.com/doctrine/',
      ],
      { cwd: root },
    )

    const home = await readFile(path.join(outDir, 'index.html'), 'utf8')
    const chinese = await readFile(path.join(outDir, 'zh-CN/index.html'), 'utf8')
    const customization = await readFile(path.join(outDir, 'customization/index.html'), 'utf8')
    const features = await readFile(path.join(outDir, 'features/index.html'), 'utf8')
    const notFound = await readFile(path.join(outDir, '404.html'), 'utf8')
    const stylesheet = home.match(/href="\/doctrine\/(assets\/[^"]+\.css)"/)?.[1]
    assert.ok(stylesheet)
    const css = await readFile(path.join(outDir, stylesheet), 'utf8')
    assert.match(home, /href="\/doctrine\/assets\//)
    assert.match(home, /href="\/doctrine\/guide\/getting-started\/"/)
    assert.match(home, /lucide-book-open/)
    assert.match(home, /<span>Guide<\/span>/)
    assert.match(home, /<span>Features<\/span>/)
    assert.ok(home.indexOf('<span>Guide</span>') < home.indexOf('<span>Features</span>'))
    assert.match(home, /href="https:\/\/github\.com\/jikkai\/doctrine"/)
    assert.match(home, /Copyright © 2026 白熱\./)
    assert.match(home, /https:\/\/example\.com\/doctrine\//)
    assert.match(home, /hreflang="zh-CN"/)
    assert.match(home, /doctrine-theme/)
    assert.match(home, /data-doctrine-callout="true"/)
    assert.match(home, /data-slot="callout"/)
    assert.match(home, /Register React components once/)
    assert.match(features, /data-slot="badge"/)
    assert.match(customization, /data-slot="card-grid"/)
    assert.match(customization, /data-slot="steps"/)
    assert.match(customization, /data-slot="tabs"/)
    assert.match(css, /--doctrine-background/)
    assert.match(css, /--doctrine-ring:oklch\(58% \.17 250\)/)
    assert.ok(
      css.indexOf('--doctrine-ring:oklch(58% .17 250)') >
        css.indexOf('--doctrine-ring:oklch(55% 0 0)'),
    )
    assert.match(chinese, /lang="zh-CN"/)
    assert.match(chinese, /<span>指南<\/span>/)
    assert.match(chinese, /版权所有 © 2026 白熱。/)
    assert.match(notFound, /src="\/doctrine\/assets\//)
    assert.ok(existsSync(path.join(outDir, 'pagefind/pagefind.js')))
    assert.equal(existsSync(path.join(outDir, 'doctrine/index.html')), false)
  } finally {
    await rm(outDir, { force: true, recursive: true })
  }
}, 60_000)

test('includes runtime utilities when built outside the package root', async () => {
  const packageRoot = process.cwd()
  const root = await mkdtemp(path.join(tmpdir(), 'doctrine-consumer-'))
  const outDir = path.join(root, 'dist')
  try {
    await symlink(
      path.join(packageRoot, 'node_modules'),
      path.join(root, 'node_modules'),
      'junction',
    )
    await mkdir(path.join(root, 'docs'))
    await writeFile(path.join(root, 'docs/index.mdx'), '# External consumer\n')
    await writeFile(
      path.join(root, 'docs/meta.ts'),
      "export default { items: [{ page: 'index', title: 'External consumer' }] }\n",
    )
    await execFileAsync(
      process.execPath,
      [path.join(packageRoot, 'dist/cli.js'), 'build', 'docs'],
      {
        cwd: root,
      },
    )

    const home = await readFile(path.join(outDir, 'index.html'), 'utf8')
    assert.match(home, /data-pagefind-meta="title" content="External consumer"/)
    const stylesheet = home.match(/href="\/(assets\/[^"]+\.css)"/)?.[1]
    assert.ok(stylesheet)
    const css = await readFile(path.join(outDir, stylesheet), 'utf8')
    assert.match(css, /\.sticky\{position:sticky\}/)
    assert.match(css, /\.hidden\{display:none\}/)
  } finally {
    await rm(root, { force: true, recursive: true })
  }
}, 60_000)
