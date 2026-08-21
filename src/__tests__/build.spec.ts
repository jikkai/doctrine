import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { promisify } from 'node:util'
import path from 'node:path'
import { test } from 'vitest'

const execFileAsync = promisify(execFile)

function navigationLinkIndex(html: string, href: string, label: string): number {
  const navigationStart = html.indexOf('data-slot="navigation"')
  if (navigationStart === -1) return -1
  const navigationEnd = html.indexOf('</nav>', navigationStart)
  if (navigationEnd === -1) return -1
  const navigation = html.slice(navigationStart, navigationEnd)
  const linkStart = navigation.indexOf(`href="${href}"`)
  if (linkStart === -1) return -1
  const linkContentStart = navigation.indexOf('>', linkStart)
  if (linkContentStart === -1) return -1
  const linkEnd = navigation.indexOf('</a>', linkStart)
  if (linkEnd === -1) return -1
  const linkText = navigation
    .slice(linkContentStart + 1, linkEnd)
    .replaceAll(/<[^>]+>/g, '')
    .trim()
  return linkText === label ? linkStart : -1
}

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
    const gettingStartedIndex = navigationLinkIndex(
      features,
      '/doctrine/getting-started/',
      'Getting started',
    )
    const featuresIndex = navigationLinkIndex(features, '/doctrine/features/', 'Features')
    assert.notEqual(gettingStartedIndex, -1)
    assert.notEqual(featuresIndex, -1)
    assert.equal(navigationLinkIndex(features, '/doctrine/', 'Doctrine'), -1)
    assert.ok(gettingStartedIndex < featuresIndex)
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
    assert.notEqual(
      navigationLinkIndex(chineseFeatures, '/doctrine/zh-CN/getting-started/', '入门教程'),
      -1,
    )
    assert.match(chineseFeatures, /aria-label="页面导航"/)
    assert.match(chinese, /copyright © 2026 白熱。/)
    assert.match(notFound, /src="\/doctrine\/assets\//)
    assert.ok(existsSync(path.join(outDir, 'pagefind/pagefind.js')))
    assert.ok(existsSync(path.join(outDir, 'getting-started/index.html')))
    assert.ok(existsSync(path.join(outDir, 'zh-CN/getting-started/index.html')))
    assert.equal(existsSync(path.join(outDir, 'guide/getting-started/index.html')), false)
    assert.equal(existsSync(path.join(outDir, 'doctrine/index.html')), false)
  } finally {
    await rm(outDir, { force: true, maxRetries: 5, recursive: true, retryDelay: 50 })
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
    const rawSourceMarker = 'RAW_SOURCE_ONLY_DOCTRINE_7C7E'
    const homeSource = `---\ndescription: Raw source stays byte-for-byte intact.\n---\n\n{/* ${rawSourceMarker} */}\n\n# External consumer\n`
    const routeSource = '# Source route\n\nThe English source bytes.\n'
    const localizedRouteSource = '# 源路由\n\n中文源文件字节。\n'
    const indexRouteSource = '# Index route\n\nThis must not overwrite the home source.\n'
    const navigationSource =
      "export default { items: [{ page: 'index', title: 'External consumer' }, { page: 'landing', title: 'Standalone' }, { directory: 'guide' }, { directory: 'index' }] }\n"
    await mkdir(path.join(root, 'docs/guide'), { recursive: true })
    await mkdir(path.join(root, 'docs/index'))
    await writeFile(
      path.join(root, 'doctrine.config.ts'),
      "export default { copyright: 'Copyright', githubUrl: 'https://github.com/amamo/doctrine.git', locales: { default: 'en', names: ['en', 'zh-CN'] } }\n",
    )
    await writeFile(path.join(root, 'docs/index.mdx'), homeSource)
    await writeFile(path.join(root, 'docs/guide/route.mdx'), routeSource)
    await writeFile(path.join(root, 'docs/guide/route.zh-CN.mdx'), localizedRouteSource)
    await writeFile(path.join(root, 'docs/index/page.mdx'), indexRouteSource)
    await writeFile(
      path.join(root, 'docs/landing.tsx'),
      'export default function Landing() { return <main data-standalone-page>Standalone content</main> }\n',
    )
    await writeFile(
      path.join(root, 'docs/component.tsx'),
      "import 'missing-unused-dependency'; export function Component() { return null }\n",
    )
    await writeFile(path.join(root, 'docs/meta.ts'), navigationSource)
    await writeFile(
      path.join(root, 'docs/meta.zh-CN.ts'),
      "export default { items: [{ directory: 'guide' }] }\n",
    )
    await writeFile(
      path.join(root, 'docs/guide/meta.ts'),
      "export default { title: 'Guide', items: [{ page: 'route', title: 'Source route' }] }\n",
    )
    await writeFile(
      path.join(root, 'docs/guide/meta.zh-CN.ts'),
      "export default { title: '指南', items: [{ page: 'route', title: '源路由' }] }\n",
    )
    await writeFile(
      path.join(root, 'docs/index/meta.ts'),
      "export default { title: 'Index', items: [{ page: 'page', title: 'Index route' }] }\n",
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
    const route = await readFile(path.join(outDir, 'guide/route/index.html'), 'utf8')
    const indexRoute = await readFile(path.join(outDir, 'index/index.html'), 'utf8')
    const localizedRoute = await readFile(path.join(outDir, 'zh-CN/guide/route/index.html'), 'utf8')
    assert.equal(await readFile(path.join(outDir, 'index.md'), 'utf8'), homeSource)
    assert.equal(await readFile(path.join(outDir, 'guide/route.md'), 'utf8'), routeSource)
    assert.equal(await readFile(path.join(outDir, 'index/index.md'), 'utf8'), indexRouteSource)
    assert.equal(
      await readFile(path.join(outDir, 'zh-CN/guide/route.md'), 'utf8'),
      localizedRouteSource,
    )
    const clientJavaScript = await Promise.all(
      (await readdir(path.join(outDir, 'assets'), { recursive: true }))
        .filter((file) => file.endsWith('.js'))
        .map((file) => readFile(path.join(outDir, 'assets', file), 'utf8')),
    )
    assert.equal(
      clientJavaScript.some((contents) => contents.includes(rawSourceMarker)),
      false,
    )
    assert.doesNotMatch(home, /data-slot="version"/)
    assert.match(home, /data-pagefind-meta="title" content="External consumer"/)
    assert.notEqual(navigationLinkIndex(home, '/landing/', 'Standalone'), -1)
    assert.match(home, /data-slot="page-actions"/)
    assert.match(
      home,
      /<link rel="alternate" type="text\/markdown" href="http:\/\/localhost\/index\.md">/,
    )
    assert.match(
      route,
      /<link rel="alternate" type="text\/markdown" href="http:\/\/localhost\/guide\/route\.md">/,
    )
    assert.match(
      indexRoute,
      /<link rel="alternate" type="text\/markdown" href="http:\/\/localhost\/index\/index\.md">/,
    )
    assert.match(
      localizedRoute,
      /<link rel="alternate" type="text\/markdown" href="http:\/\/localhost\/zh-CN\/guide\/route\.md">/,
    )
    assert.match(landing, /data-standalone-page/)
    assert.match(landing, /data-slot="header"/)
    assert.match(landing, /data-slot="footer"/)
    assert.doesNotMatch(landing, /data-slot="sidebar"/)
    assert.doesNotMatch(landing, /data-slot="toc"/)
    assert.doesNotMatch(landing, /data-slot="page-actions"/)
    assert.doesNotMatch(landing, /rel="alternate" type="text\/markdown"/)
    assert.equal(existsSync(path.join(outDir, 'landing.md')), false)
    const stylesheet = home.match(/href="\/(assets\/[^"]+\.css)"/)?.[1]
    assert.ok(stylesheet)
    assert.ok(existsSync(path.join(outDir, stylesheet)))

    await mkdir(path.join(root, 'public'))
    await writeFile(path.join(root, 'public/index.md'), 'Public file must not be overwritten.\n')
    await assert.rejects(
      execFileAsync(
        process.execPath,
        [path.join(root, 'node_modules/@amamo/doctrine/dist/cli.js'), 'build', 'docs'],
        { cwd: root },
      ),
      /Markdown output \/index\.md conflicts with existing output index\.md/,
    )
    await rm(path.join(root, 'public'), { recursive: true })

    await Promise.all([
      writeFile(path.join(root, 'docs/foo.mdx'), '# Foo\n'),
      writeFile(path.join(root, 'docs/foo.md.mdx'), '# Foo Markdown\n'),
      writeFile(
        path.join(root, 'docs/meta.ts'),
        "export default { items: [{ page: 'index', title: 'External consumer' }, { page: 'landing', title: 'Standalone' }, { directory: 'guide' }, { directory: 'index' }, { page: 'foo', title: 'Foo' }, { page: 'foo.md', title: 'Foo Markdown' }] }\n",
      ),
    ])
    await assert.rejects(
      execFileAsync(
        process.execPath,
        [path.join(root, 'node_modules/@amamo/doctrine/dist/cli.js'), 'build', 'docs'],
        { cwd: root },
      ),
      /Markdown output for \/foo\/ at foo\.md conflicts with HTML output for \/foo\.md\/ at foo\.md\/index\.html/,
    )
    assert.equal(existsSync(path.join(outDir, 'index.html')), false)
    assert.equal(existsSync(path.join(outDir, 'foo.md')), false)
    assert.equal(existsSync(path.join(outDir, 'foo.md/index.html')), false)
    await Promise.all([
      rm(path.join(root, 'docs/foo.mdx')),
      rm(path.join(root, 'docs/foo.md.mdx')),
      writeFile(path.join(root, 'docs/meta.ts'), navigationSource),
    ])

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
      "export default { copyright: 'Copyright', locales: { default: 'en', names: ['en', 'zh-CN'] }, styles: './docs/theme.css' }\n",
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
    await rm(root, { force: true, maxRetries: 5, recursive: true, retryDelay: 50 })
  }
}, 120_000)
