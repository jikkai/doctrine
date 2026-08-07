import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import type { IAmamoMdxConfig } from '@amamo/mdx'
import { amamoMdx } from '@amamo/mdx/vite'
import type { Plugin, ViteDevServer } from 'vite'

import type { INormalizedDoctrineConfig } from './config.js'
import type { IRuntimeConfig } from './runtime/types.js'

const CONTENT_ID = 'virtual:doctrine/content'
const COMPONENTS_ID = 'virtual:doctrine/components'
const CONFIG_ID = 'virtual:doctrine/config'
const CUSTOM_STYLES_ID = 'virtual:doctrine/custom-styles.css'
const STYLES_ID = 'virtual:doctrine/styles.css'
const RESOLVED_CONTENT_ID = `\0${CONTENT_ID}`
const RESOLVED_COMPONENTS_ID = `\0${COMPONENTS_ID}`
const RESOLVED_CONFIG_ID = `\0${CONFIG_ID}`
const RESOLVED_CUSTOM_STYLES_ID = `\0${CUSTOM_STYLES_ID}`
const RESOLVED_STYLES_ID = `\0${STYLES_ID}`

export interface IDoctrinePluginOptions {
  config: INormalizedDoctrineConfig
  dev: boolean
  onContentChange?: () => void
  packageRoot?: string
}

export function doctrinePackageRoot(): string {
  return path.dirname(fileURLToPath(import.meta.url))
}

export function runtimeEntry(
  name: 'client' | 'server',
  packageRoot = doctrinePackageRoot(),
): string {
  return path.join(packageRoot, `runtime/entry-${name}.js`)
}

export function doctrinePlugins(options: IDoctrinePluginOptions): Plugin[] {
  const generatedModule = path.join(options.config.root, '.amamo-mdx/collections.mjs')
  const styles = path.join(options.packageRoot ?? doctrinePackageRoot(), 'runtime/styles.css')
  const runtimeConfig: IRuntimeConfig = {
    base: options.config.base,
    description: options.config.description,
    dev: options.dev,
    locales: options.config.locales,
    siteUrl: options.config.siteUrl,
    title: options.config.title,
  }

  const amamoConfig: IAmamoMdxConfig = {
    collections: {
      docs: {
        directory: options.config.contentDirectory,
        locales: options.config.locales,
        schema: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            order: { type: 'number' },
            title: { type: 'string' },
          },
          required: ['title'],
        },
      },
    },
    generatedDirectory: path.dirname(generatedModule),
    root: options.config.root,
  }
  const mdxPlugin = amamoMdx(amamoConfig) as unknown as Plugin

  return [
    mdxPlugin,
    {
      name: 'doctrine',
      enforce: 'pre',
      resolveId(source) {
        if (source === '@amamo/doctrine/components') {
          return path.join(options.packageRoot ?? doctrinePackageRoot(), 'components.js')
        }
        if (source === CONTENT_ID) return RESOLVED_CONTENT_ID
        if (source === COMPONENTS_ID) return RESOLVED_COMPONENTS_ID
        if (source === CONFIG_ID) return RESOLVED_CONFIG_ID
        if (source === CUSTOM_STYLES_ID) {
          return options.config.styles ?? RESOLVED_CUSTOM_STYLES_ID
        }
        if (source === STYLES_ID) return RESOLVED_STYLES_ID
        return null
      },
      async load(id) {
        if (id === RESOLVED_CONTENT_ID) {
          return `import { collections } from ${JSON.stringify(generatedModule)}; export const documents = collections.docs ?? [];`
        }
        if (id === RESOLVED_COMPONENTS_ID) {
          return options.config.components
            ? `export { default } from ${JSON.stringify(options.config.components)};`
            : 'export default {};'
        }
        if (id === RESOLVED_CONFIG_ID) return `export default ${JSON.stringify(runtimeConfig)};`
        if (id === RESOLVED_CUSTOM_STYLES_ID) return ''
        if (id === RESOLVED_STYLES_ID) {
          const source = await readFile(styles, 'utf8')
          const componentSource = options.config.components
            ? `\n@source ${JSON.stringify(options.config.components)};`
            : ''
          return `${source}\n@source ${JSON.stringify(path.dirname(styles))};\n@source ${JSON.stringify(options.config.contentDirectory)};${componentSource}\n`
        }
        return null
      },
      configureServer(server: ViteDevServer) {
        if (!options.onContentChange) return
        const markChanged = (file: string) => {
          if (isContentFile(file, options.config.contentDirectory)) options.onContentChange?.()
        }
        server.watcher.on('add', markChanged)
        server.watcher.on('unlink', markChanged)
        server.httpServer?.once('close', () => {
          server.watcher.off('add', markChanged)
          server.watcher.off('unlink', markChanged)
        })
      },
      handleHotUpdate(context) {
        if (isContentFile(context.file, options.config.contentDirectory)) {
          options.onContentChange?.()
        }
      },
    },
  ]
}

function isContentFile(file: string, directory: string): boolean {
  const relative = path.relative(directory, file)
  return !relative.startsWith('..') && !path.isAbsolute(relative) && file.endsWith('.mdx')
}
