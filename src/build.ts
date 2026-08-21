import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import type { Manifest } from 'vite'
import react from '@vitejs/plugin-react'
import * as pagefind from 'pagefind'
import { createBuilder } from 'vite'
import type { INormalizedDoctrineConfig } from './config.js'
import type { IDocumentSource, IPageAssets } from './runtime/types.js'
import { findOutputConflict, resolveOutputFile } from './output.js'
import { withBase } from './runtime/url.js'
import { doctrinePackageRoot, doctrinePlugins, runtimeEntry } from './vite.js'

export interface IBuildResult {
  outDir: string
  pages: number
}

interface IServerBundle {
  getRoutePaths: () => string[]
  getRouteSource: (pathname: string) => IDocumentSource | undefined
  renderPage: (pathname: string, assets: IPageAssets) => Promise<string>
}

export async function build(config: INormalizedDoctrineConfig): Promise<IBuildResult> {
  assertSafeOutput(config)
  const workRoot = path.join(config.root, '.doctrine')
  await mkdir(workRoot, { recursive: true })
  const temporaryRoot = await mkdtemp(path.join(workRoot, 'build-'))
  const packageRoot = path.join(temporaryRoot, 'package')
  const serverOut = path.join(temporaryRoot, 'server')
  await cp(doctrinePackageRoot(), packageRoot, { recursive: true })

  try {
    const builder = await createBuilder({
      appType: 'custom',
      base: config.base,
      builder: { sharedPlugins: true },
      configFile: false,
      environments: {
        client: {
          build: {
            emptyOutDir: true,
            manifest: true,
            outDir: config.outDir,
            rollupOptions: { input: { app: runtimeEntry('client', packageRoot) } },
          },
        },
        ssr: {
          build: {
            emptyOutDir: true,
            outDir: serverOut,
            rollupOptions: {
              input: { server: runtimeEntry('server', packageRoot) },
              output: { entryFileNames: 'entry-server.mjs' },
            },
            ssr: true,
          },
        },
      },
      plugins: [react(), ...doctrinePlugins({ config, dev: false, packageRoot })],
      root: config.root,
    })
    await builder.buildApp()

    const assets = await readAssets(config)
    const serverUrl = `${pathToFileURL(path.join(serverOut, 'entry-server.mjs')).href}?t=${Date.now()}`
    const server = (await import(serverUrl)) as IServerBundle
    const routes = server.getRoutePaths()
    const markdownPages = new Map(
      await Promise.all(
        routes.flatMap((route) => {
          const source = server.getRouteSource(route)
          return source
            ? [
                readFile(path.join(config.contentDirectory, source.sourcePath), 'utf8').then(
                  (contents) => [route, { contents, path: source.markdownPath }] as const,
                ),
              ]
            : []
        }),
      ),
    )
    for (const page of markdownPages.values()) {
      const conflict = await findOutputConflict(config.outDir, page.path)
      if (conflict) {
        throw new Error(
          `Markdown output ${page.path} conflicts with existing output ${path.relative(config.outDir, conflict)}`,
        )
      }
    }
    for (const route of routes) {
      await writePage(config.outDir, route, await server.renderPage(route, assets))
      const markdown = markdownPages.get(route)
      if (markdown) {
        await writeMarkdown(config.outDir, markdown.path, markdown.contents)
      }
    }
    await writeFile(
      path.join(config.outDir, '404.html'),
      await server.renderPage('/__doctrine_not_found__/', assets),
    )
    await rm(path.join(config.outDir, '.vite'), { force: true, recursive: true })
    await buildSearchIndex(config.outDir)
    return { outDir: config.outDir, pages: routes.length }
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true })
  }
}

async function readAssets(config: INormalizedDoctrineConfig): Promise<IPageAssets> {
  const value = JSON.parse(
    await readFile(path.join(config.outDir, '.vite/manifest.json'), 'utf8'),
  ) as Manifest
  const entry = Object.values(value).find((chunk) => chunk.isEntry)
  if (!entry) throw new Error('Vite did not emit a client entry')
  return {
    scripts: [withBase(config.base, `/${entry.file}`)],
    styles: (entry.css ?? []).map((file) => withBase(config.base, `/${file}`)),
  }
}

async function writePage(outDir: string, route: string, contents: string): Promise<void> {
  const segments = route
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
  const directory = path.join(outDir, ...segments)
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'index.html'), contents)
}

async function writeMarkdown(
  outDir: string,
  markdownPath: string,
  contents: string,
): Promise<void> {
  const file = resolveOutputFile(outDir, markdownPath)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, contents, { flag: 'wx' })
}

async function buildSearchIndex(outDir: string): Promise<void> {
  const response = await pagefind.createIndex()
  if (!response.index)
    throw new Error(response.errors.join('\n') || 'Unable to create Pagefind index')
  try {
    const indexed = await response.index.addDirectory({ path: outDir })
    if (indexed.errors.length > 0) throw new Error(indexed.errors.join('\n'))
    const written = await response.index.writeFiles({ outputPath: path.join(outDir, 'pagefind') })
    if (written.errors.length > 0) throw new Error(written.errors.join('\n'))
  } finally {
    await pagefind.close()
  }
}

function assertSafeOutput(config: INormalizedDoctrineConfig): void {
  const relativeToRoot = path.relative(config.root, config.outDir)
  const relativeToContent = path.relative(config.contentDirectory, config.outDir)
  if (
    !relativeToRoot ||
    relativeToRoot.startsWith('..') ||
    path.isAbsolute(relativeToRoot) ||
    (!relativeToContent.startsWith('..') && !path.isAbsolute(relativeToContent))
  ) {
    throw new Error('outDir must be inside the project root and outside the MDX directory')
  }
}
