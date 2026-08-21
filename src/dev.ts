import type { IncomingMessage, ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import * as pagefind from 'pagefind'
import { createServer } from 'vite'
import type { INormalizedDoctrineConfig } from './config.js'
import type { IDocumentSource, IPageAssets } from './runtime/types.js'
import { findOutputConflict } from './output.js'
import {
  documentRouteFromMarkdownPath,
  normalizeRoutePath,
  withBase,
  withoutBase,
} from './runtime/url.js'
import { doctrinePlugins, runtimeEntry } from './vite.js'

export interface IDevOptions {
  host: string
  port: number
}

interface IServerBundle {
  getRoutePaths: () => string[]
  getRouteSource: (pathname: string) => IDocumentSource | undefined
  renderPage: (pathname: string, assets: IPageAssets) => Promise<string>
}

interface IOriginalRequest extends IncomingMessage {
  originalUrl?: string
}

export async function dev(
  config: INormalizedDoctrineConfig,
  options: IDevOptions,
): Promise<ViteDevServer> {
  let searchFiles: Promise<Map<string, Uint8Array>> | undefined
  const markSearchDirty = () => {
    searchFiles = undefined
  }

  const markdownPlugin: Plugin = {
    name: 'doctrine-dev-markdown',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        return handleMarkdownRequest(server, request, response).then(
          (handled) => {
            if (!handled) next()
            return undefined
          },
          (error: unknown) => {
            server.ssrFixStacktrace(error as Error)
            next(error)
            return undefined
          },
        )
      })
    },
  }

  const htmlPlugin: Plugin = {
    name: 'doctrine-dev-html',
    configureServer(server) {
      return () => {
        server.middlewares.use((request, response, next) => {
          return handleRequest(server, request, response).then(
            (handled) => {
              if (!handled) next()
              return undefined
            },
            (error: unknown) => {
              server.ssrFixStacktrace(error as Error)
              next(error)
              return undefined
            },
          )
        })
      }
    },
  }

  async function handleMarkdownRequest(
    server: ViteDevServer,
    request: IOriginalRequest,
    response: ServerResponse,
  ): Promise<boolean> {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false
    const requestUrl = request.originalUrl ?? request.url ?? '/'
    const url = new URL(requestUrl, 'http://doctrine.local')
    const relativePath = url.pathname.startsWith(config.base)
      ? `/${url.pathname.slice(config.base.length)}`
      : undefined
    const markdownRoute = relativePath ? documentRouteFromMarkdownPath(relativePath) : undefined
    if (!markdownRoute) return false
    const module = (await server.ssrLoadModule(runtimeEntry('server'))) as IServerBundle
    const source = module.getRouteSource(markdownRoute)
    if (!source) return false
    const markdown = await readFile(path.join(config.contentDirectory, source.sourcePath), 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    if (request.method === 'HEAD') response.end()
    else response.end(markdown)
    return true
  }

  async function handleRequest(
    server: ViteDevServer,
    request: IOriginalRequest,
    response: ServerResponse,
  ): Promise<boolean> {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false
    const requestUrl = request.originalUrl ?? request.url ?? '/'
    const url = new URL(requestUrl, 'http://doctrine.local')
    const pagefindPrefix = withBase(config.base, '/pagefind/')
    if (url.pathname.startsWith(pagefindPrefix)) {
      // ponytail: rebuilds the whole development index after an MDX change; add incremental indexing when dev latency matters.
      searchFiles ??= buildDevSearchFiles(server)
      const files = await searchFiles
      const name = url.pathname.slice(pagefindPrefix.length)
      const contents = files.get(name)
      if (!contents) {
        response.statusCode = 404
        response.end()
        return true
      }
      response.setHeader('Content-Type', contentType(name))
      response.end(contents)
      return true
    }

    const pathname = withoutBase(config.base, url.pathname)
    if (!pathname) return false
    const module = (await server.ssrLoadModule(runtimeEntry('server'))) as IServerBundle
    const clientEntry = runtimeEntry('client')
    const styles = [
      devAssetUrl(path.join(path.dirname(clientEntry), 'styles.css')),
      ...(config.styles ? [devAssetUrl(config.styles)] : []),
    ]
    const html = await module.renderPage(pathname, {
      scripts: [devAssetUrl(clientEntry)],
      styles,
    })
    const transformed = await server.transformIndexHtml(url.pathname, html)
    response.statusCode = module.getRoutePaths().includes(normalizeRoutePath(pathname)) ? 200 : 404
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    if (request.method === 'HEAD') response.end()
    else response.end(transformed)
    return true
  }

  async function buildDevSearchFiles(server: ViteDevServer): Promise<Map<string, Uint8Array>> {
    const module = (await server.ssrLoadModule(runtimeEntry('server'))) as IServerBundle
    const response = await pagefind.createIndex()
    if (!response.index)
      throw new Error(response.errors.join('\n') || 'Unable to create Pagefind index')
    try {
      for (const route of module.getRoutePaths()) {
        const sourcePath = route === '/' ? 'index.html' : `${route.slice(1)}index.html`
        const added = await response.index.addHTMLFile({
          content: await module.renderPage(route, { scripts: [], styles: [] }),
          sourcePath,
        })
        if (added.errors.length > 0) throw new Error(added.errors.join('\n'))
      }
      const files = await response.index.getFiles()
      if (files.errors.length > 0) throw new Error(files.errors.join('\n'))
      return new Map(
        files.files.map((file) => [file.path.replace(/^pagefind\//, ''), file.content]),
      )
    } finally {
      await pagefind.close()
    }
  }

  const server = await createServer({
    appType: 'custom',
    base: config.base,
    configFile: false,
    optimizeDeps: {
      include: [
        '@amamo/doctrine > @base-ui/react/button',
        '@amamo/doctrine > @base-ui/react/dialog',
        '@amamo/doctrine > @base-ui/react/menu',
        '@amamo/doctrine > @base-ui/react/select',
        '@amamo/doctrine > @base-ui/react/tabs',
        '@amamo/doctrine > lucide-react',
        '@amamo/doctrine > react-dom/client',
      ],
    },
    plugins: [
      react(),
      ...doctrinePlugins({ config, dev: true, onContentChange: markSearchDirty }),
      markdownPlugin,
      htmlPlugin,
    ],
    root: config.root,
    server: {
      host: options.host,
      port: options.port,
      watch: {
        awaitWriteFinish: {
          pollInterval: 10,
          stabilityThreshold: 100,
        },
      },
    },
  })
  try {
    await server.listen()
    await assertPublicMarkdownCompatibility(server)
  } catch (error) {
    await server.close()
    throw error
  }
  server.printUrls()
  return server

  async function assertPublicMarkdownCompatibility(viteServer: ViteDevServer): Promise<void> {
    const module = (await viteServer.ssrLoadModule(runtimeEntry('server'))) as IServerBundle
    const publicDirectory = path.join(config.root, 'public')
    for (const route of module.getRoutePaths()) {
      const source = module.getRouteSource(route)
      if (!source) continue
      const conflict = await findOutputConflict(publicDirectory, source.markdownPath)
      if (conflict) {
        throw new Error(
          `Markdown route ${source.markdownPath} conflicts with public output ${path.relative(publicDirectory, conflict)}`,
        )
      }
    }
  }
}

function devAssetUrl(file: string): string {
  return `/@fs/${file.split(path.sep).join('/').replace(/^\//, '')}`
}

function contentType(file: string): string {
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8'
  if (file.endsWith('.wasm')) return 'application/wasm'
  if (file.endsWith('.json')) return 'application/json; charset=utf-8'
  return 'application/octet-stream'
}
