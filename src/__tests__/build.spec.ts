import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { promisify } from 'node:util'
import path from 'node:path'
import { test } from 'vitest'

const execFileAsync = promisify(execFile)

test('builds localized static pages and search below a GitHub Pages subpath', async () => {
  const root = process.cwd()
  const outDir = path.join(root, '.doctrine-test-dist')
  try {
    const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as {
      version: string
    }
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
    const chineseFeatures = await readFile(path.join(outDir, 'zh-CN/features/index.html'), 'utf8')
    const customization = await readFile(path.join(outDir, 'customization/index.html'), 'utf8')
    const features = await readFile(path.join(outDir, 'features/index.html'), 'utf8')
    const mdxComponents = await readFile(path.join(outDir, 'mdx-components/index.html'), 'utf8')
    const notFound = await readFile(path.join(outDir, '404.html'), 'utf8')
    const stylesheet = home.match(/href="\/doctrine\/(assets\/[^"]+\.css)"/)?.[1]
    assert.ok(stylesheet)
    assert.ok(existsSync(path.join(outDir, stylesheet)))
    const styles = await readFile(path.join(outDir, stylesheet), 'utf8')
    assert.ok(styles.includes(`content:"v${manifest.version}"`))
    assert.match(home, /href="\.\/getting-started\/"/)
    assert.match(features, /lucide-rocket/)
    assert.match(features, /<span>Getting started<\/span>/)
    assert.match(features, /<span>Features<\/span>/)
    assert.doesNotMatch(features, /<span>Doctrine<\/span>/)
    assert.ok(
      features.indexOf('<span>Getting started</span>') < features.indexOf('<span>Features</span>'),
    )
    assert.match(home, /href="https:\/\/github\.com\/jikkai\/doctrine"/)
    assert.doesNotMatch(home, /data-slot="version"/)
    assert.match(home, /data-slot="header-navigation"/)
    assert.match(home, /href="\/doctrine\/getting-started\/">Documentation<\/a>/)
    assert.match(home, /aria-label="Language"/)
    assert.match(home, /href="#main-content"[^>]*>Skip to content<\/a>/)
    assert.match(home, /<main[^>]*id="main-content"[^>]*>/)
    assert.match(
      home,
      /<meta name="description" content="A Vite-powered static documentation generator for MDX\."/,
    )
    assert.match(home, /copyright © 2026 白熱。/)
    assert.match(home, /https:\/\/example\.com\/doctrine\//)
    assert.match(home, /hreflang="zh-CN"/)
    assert.doesNotMatch(home, /data-slot="sidebar"/)
    assert.doesNotMatch(home, /data-slot="toc"/)
    assert.match(features, /data-slot="badge"/)
    assert.match(
      features,
      /data-slot="header-navigation"[\s\S]*?aria-current="location"[\s\S]*?>Documentation<\/a>/,
    )
    assert.match(features, /aria-label="Page navigation"/)
    assert.match(mdxComponents, /data-slot="card-grid"/)
    assert.match(mdxComponents, /data-slot="code-block"/)
    assert.match(mdxComponents, /data-slot="code-block-filename"[^>]*>doctrine\.config\.ts/)
    assert.match(mdxComponents, /data-slot="code-block-language">TypeScript/)
    assert.match(mdxComponents, /aria-label="Copy code"/)
    assert.match(mdxComponents, /data-slot="steps"/)
    assert.match(mdxComponents, /data-slot="tabs"/)
    assert.match(mdxComponents, /data-slot="live-preview"/)
    assert.match(mdxComponents, /data-slot="live-preview-code-toggle"[\s\S]*?>Source</)
    assert.match(mdxComponents, /data-slot="file-tree"/)
    assert.match(mdxComponents, /aria-current="true"[\s\S]*?>index\.mdx</)
    assert.match(mdxComponents, />Count: <!-- -->0<\/button>/)
    assert.match(mdxComponents, /<h2 id="built-in-components">/)
    assert.match(customization, /data-slot="toc"/)
    assert.match(customization, /<h2 id="add-a-stylesheet">/)
    assert.doesNotMatch(chinese, /data-slot="sidebar"/)
    assert.doesNotMatch(chinese, /data-slot="toc"/)
    assert.match(chinese, /lang="zh-CN"/)
    assert.match(chinese, /href="#main-content"[^>]*>跳到正文<\/a>/)
    assert.match(chinese, /data-slot="header-navigation"[\s\S]*?>文档<\/a>/)
    assert.match(
      chinese,
      /<meta name="description" content="一个由 Vite 驱动的 MDX 静态文档生成器。"/,
    )
    assert.match(chineseFeatures, /<span>入门教程<\/span>/)
    assert.match(chineseFeatures, /aria-label="页面导航"/)
    assert.match(chinese, /copyright © 2026 白熱。/)
    assert.match(notFound, /src="\/doctrine\/assets\//)
    assert.ok(existsSync(path.join(outDir, 'pagefind/pagefind.js')))
    assert.ok(existsSync(path.join(outDir, 'getting-started/index.html')))
    assert.ok(existsSync(path.join(outDir, 'zh-CN/getting-started/index.html')))
    assert.equal(existsSync(path.join(outDir, 'guide/getting-started/index.html')), false)
    assert.equal(existsSync(path.join(outDir, 'doctrine/index.html')), false)
  } finally {
    await rm(outDir, { force: true, recursive: true })
  }
}, 60_000)

test('builds in an isolated pnpm consumer', async () => {
  const packageRoot = process.cwd()
  const root = await mkdtemp(path.join(tmpdir(), 'doctrine-consumer-'))
  const outDir = path.join(root, 'dist')
  const installArgs = [
    'install',
    '--ignore-scripts',
    '--no-frozen-lockfile',
    '--prefer-offline',
    '--config.node-linker=isolated',
  ]
  try {
    const archive = path.join(root, 'doctrine.tgz')
    await execFileAsync('pnpm', ['--config.ignore-scripts=true', 'pack', '--out', archive], {
      cwd: packageRoot,
    })
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({
        dependencies: { '@amamo/doctrine': `file:${archive}` },
        private: true,
        type: 'module',
      }),
    )
    await execFileAsync('pnpm', installArgs, { cwd: root })
    assert.equal(existsSync(path.join(root, 'node_modules/react')), false)
    assert.equal(existsSync(path.join(root, 'node_modules/tailwindcss')), false)
    await mkdir(path.join(root, 'docs'))
    await writeFile(
      path.join(root, 'doctrine.config.ts'),
      "export default { copyright: 'Copyright' }\n",
    )
    await writeFile(path.join(root, 'docs/index.mdx'), '# External consumer\n')
    await writeFile(
      path.join(root, 'docs/landing.tsx'),
      'export default function Landing() { return <main data-standalone-page>Standalone content</main> }\n',
    )
    await writeFile(
      path.join(root, 'docs/component.tsx'),
      "import 'missing-unused-dependency'; export function Component() { return null }\n",
    )
    await writeFile(
      path.join(root, 'docs/meta.ts'),
      "export default { items: [{ page: 'index', title: 'External consumer' }, { page: 'landing', title: 'Standalone' }] }\n",
    )
    await execFileAsync(
      process.execPath,
      [path.join(root, 'node_modules/@amamo/doctrine/dist/cli.js'), 'build', 'docs'],
      {
        cwd: root,
      },
    )

    const home = await readFile(path.join(outDir, 'index.html'), 'utf8')
    const landing = await readFile(path.join(outDir, 'landing/index.html'), 'utf8')
    assert.doesNotMatch(home, /data-slot="version"/)
    assert.match(home, /data-pagefind-meta="title" content="External consumer"/)
    assert.match(home, /<span>Standalone<\/span>/)
    assert.match(landing, /data-standalone-page/)
    assert.match(landing, /data-slot="header"/)
    assert.match(landing, /data-slot="footer"/)
    assert.doesNotMatch(landing, /data-slot="sidebar"/)
    assert.doesNotMatch(landing, /data-slot="toc"/)
    const stylesheet = home.match(/href="\/(assets\/[^"]+\.css)"/)?.[1]
    assert.ok(stylesheet)
    assert.ok(existsSync(path.join(outDir, stylesheet)))

    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({
        dependencies: {
          '@amamo/doctrine': `file:${archive}`,
          tailwindcss: '4.3.3',
        },
        private: true,
        type: 'module',
      }),
    )
    await execFileAsync('pnpm', installArgs, { cwd: root })
    await writeFile(
      path.join(root, 'doctrine.config.ts'),
      "export default { copyright: 'Copyright', styles: './docs/theme.css' }\n",
    )
    await writeFile(
      path.join(root, 'docs/theme.css'),
      "@import 'tailwindcss' source(none);\n@source './index.mdx';\n",
    )
    await writeFile(
      path.join(root, 'docs/index.mdx'),
      '# External consumer\n\n<div className="text-fuchsia-700">Tailwind consumer</div>\n',
    )
    await execFileAsync(
      process.execPath,
      [path.join(root, 'node_modules/@amamo/doctrine/dist/cli.js'), 'build', 'docs'],
      { cwd: root },
    )
    const tailwindHome = await readFile(path.join(outDir, 'index.html'), 'utf8')
    const tailwindStylesheet = tailwindHome.match(/href="\/(assets\/[^"]+\.css)"/)?.[1]
    assert.ok(tailwindStylesheet)
    assert.ok(existsSync(path.join(outDir, tailwindStylesheet)))
  } finally {
    await rm(root, { force: true, recursive: true })
  }
}, 120_000)
