import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { IAmamoMdxConfig } from '@amamo/mdx'
import type { Plugin, ViteDevServer } from 'vite'
import { amamoMdx } from '@amamo/mdx/vite'
import tailwindcss from '@tailwindcss/vite'
import type { INormalizedDoctrineConfig } from './config.js'
import type { ILoadedDoctrineNavigation } from './navigation.js'
import type { IRuntimeConfig } from './runtime/types.js'
import { loadDoctrineNavigation } from './navigation.js'

const CONTENT_ID = 'virtual:doctrine/content'
const COMPONENTS_ID = 'virtual:doctrine/components'
const CONFIG_ID = 'virtual:doctrine/config'
const ICONS_ID = 'virtual:doctrine/icons'
const CUSTOM_STYLES_ID = 'virtual:doctrine/custom-styles.css'
const STYLES_ID = 'virtual:doctrine/styles.css'
const RESOLVED_CONTENT_ID = `\0${CONTENT_ID}`
const RESOLVED_COMPONENTS_ID = `\0${COMPONENTS_ID}`
const RESOLVED_CONFIG_ID = `\0${CONFIG_ID}`
const RESOLVED_ICONS_ID = `\0${ICONS_ID}`
const RESOLVED_CUSTOM_STYLES_ID = `\0${CUSTOM_STYLES_ID}`
const packageRequire = createRequire(import.meta.url)

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
  const entry = path.join(packageRoot, `runtime/entry-${name}.js`)
  return existsSync(entry) ? entry : path.join(packageRoot, `runtime/entry-${name}.tsx`)
}

export function doctrinePlugins(options: IDoctrinePluginOptions): Plugin[] {
  const generatedModule = path.join(options.config.root, '.amamo-mdx/collections.mjs')
  const resolvedStylesId = path.join(options.config.root, '.doctrine-styles.css')
  const styles = path.join(options.packageRoot ?? doctrinePackageRoot(), 'runtime/styles.css')
  let navigation: Promise<ILoadedDoctrineNavigation> | undefined = Promise.resolve({
    icons: options.config.navigationIcons,
    navigation: options.config.navigation,
  })

  function currentNavigation(): Promise<ILoadedDoctrineNavigation> {
    navigation ??= loadDoctrineNavigation({
      command: 'serve',
      contentDirectory: options.config.contentDirectory,
      locales: options.config.locales,
      root: options.config.root,
    })
    return navigation
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
          },
        },
      },
    },
    generatedDirectory: path.dirname(generatedModule),
    root: options.config.root,
  }
  const mdxPlugin = amamoMdx(amamoConfig) as unknown as Plugin

  return [
    ...(usesTailwind(options.config.root) ? tailwindcss() : []),
    {
      name: 'doctrine-build-dependencies',
      apply: 'build',
      enforce: 'pre',
      resolveId(source) {
        if (!isRuntimeDependency(source)) return null
        return packageRequire.resolve(source)
      },
    },
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
        if (source === ICONS_ID) return RESOLVED_ICONS_ID
        if (source === CUSTOM_STYLES_ID) {
          return options.config.styles ?? RESOLVED_CUSTOM_STYLES_ID
        }
        if (source === STYLES_ID) return resolvedStylesId
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
        if (id === RESOLVED_CONFIG_ID) {
          const current = await currentNavigation()
          const runtimeConfig: IRuntimeConfig = {
            base: options.config.base,
            copyright: options.config.copyright,
            description: options.config.description,
            dev: options.dev,
            githubUrl: options.config.githubUrl,
            locales: options.config.locales,
            navigation: current.navigation,
            siteUrl: options.config.siteUrl,
            title: options.config.title,
          }
          return `export default ${JSON.stringify(runtimeConfig)};`
        }
        if (id === RESOLVED_ICONS_ID) {
          const { icons } = await currentNavigation()
          if (icons.length === 0) return 'export default {};'
          if (!options.config.iconLibrary) {
            throw new Error('iconLibrary is required when navigation icons are configured')
          }
          const names = icons.join(', ')
          return `import { ${names} } from ${JSON.stringify(options.config.iconLibrary)}; export default { ${names} };`
        }
        if (id === RESOLVED_CUSTOM_STYLES_ID) return ''
        if (id === resolvedStylesId) return readFile(styles, 'utf8')
        return null
      },
      configureServer(server: ViteDevServer) {
        const invalidateNavigation = (reload: boolean) => {
          navigation = undefined
          options.onContentChange?.()
          for (const id of [RESOLVED_CONFIG_ID, RESOLVED_ICONS_ID]) {
            const module = server.moduleGraph.getModuleById(id)
            if (module) server.moduleGraph.invalidateModule(module)
          }
          if (reload) server.hot.send({ type: 'full-reload' })
        }
        const handleAdd = (file: string) => {
          if (isNavigationFile(file, options.config)) invalidateNavigation(true)
          else if (isContentFile(file, options.config.contentDirectory)) {
            invalidateNavigation(false)
          }
        }
        const handleChange = (file: string) => {
          if (isNavigationFile(file, options.config)) invalidateNavigation(true)
          else if (isContentFile(file, options.config.contentDirectory)) {
            options.onContentChange?.()
          }
        }
        const handleUnlink = (file: string) => {
          if (isNavigationFile(file, options.config)) invalidateNavigation(true)
          else if (isContentFile(file, options.config.contentDirectory)) {
            invalidateNavigation(false)
          }
        }
        server.watcher.on('add', handleAdd)
        server.watcher.on('change', handleChange)
        server.watcher.on('unlink', handleUnlink)
        server.httpServer?.once('close', () => {
          server.watcher.off('add', handleAdd)
          server.watcher.off('change', handleChange)
          server.watcher.off('unlink', handleUnlink)
        })
      },
    },
  ]
}

function isRuntimeDependency(source: string): boolean {
  return ['@base-ui/react', 'lucide-react', 'react', 'react-dom'].some(
    (dependency) => source === dependency || source.startsWith(`${dependency}/`),
  )
}

function usesTailwind(root: string): boolean {
  try {
    const manifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      dependencies?: Readonly<Record<string, unknown>>
      devDependencies?: Readonly<Record<string, unknown>>
      optionalDependencies?: Readonly<Record<string, unknown>>
    }
    return [manifest.dependencies, manifest.devDependencies, manifest.optionalDependencies].some(
      (dependencies) => typeof dependencies?.tailwindcss === 'string',
    )
  } catch {
    return false
  }
}

function isContentFile(file: string, directory: string): boolean {
  const relative = path.relative(directory, file)
  return !relative.startsWith('..') && !path.isAbsolute(relative) && file.endsWith('.mdx')
}

function isNavigationFile(file: string, config: INormalizedDoctrineConfig): boolean {
  const relative = path.relative(config.contentDirectory, file)
  if (relative.startsWith('..') || path.isAbsolute(relative)) return false
  const name = path.basename(relative)
  if (name === 'meta.ts') return true
  return config.locales.names.some(
    (locale) => locale !== config.locales.default && name === `meta.${locale}.ts`,
  )
}
