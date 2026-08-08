import { readdir } from 'node:fs/promises'
import path from 'node:path'

import { loadConfigFromFile } from 'vite'

import type { IDoctrineLocaleConfig } from './config.js'

export interface IDoctrinePageNavigationItem {
  icon?: string
  page: string
  title: string
}

export interface IDoctrineDirectoryNavigationItem {
  directory: string
}

export type DoctrineDirectoryNavigationItem =
  | IDoctrinePageNavigationItem
  | IDoctrineDirectoryNavigationItem

export interface IDoctrineDirectoryConfig {
  icon?: string
  items: readonly DoctrineDirectoryNavigationItem[]
  title?: string
}

export interface INormalizedDoctrineNavigationPage {
  documentKey: string
  icon?: string
  title: string
  type: 'page'
}

export interface INormalizedDoctrineNavigationDirectory {
  directory: string
  icon?: string
  items: readonly DoctrineNavigationNode[]
  title: string
  type: 'directory'
}

export type DoctrineNavigationNode =
  | INormalizedDoctrineNavigationPage
  | INormalizedDoctrineNavigationDirectory

export type DoctrineNavigation = Readonly<Record<string, readonly DoctrineNavigationNode[]>>

export interface ILoadDoctrineNavigationOptions {
  command: 'build' | 'serve'
  contentDirectory: string
  locales: IDoctrineLocaleConfig
  root: string
}

export interface ILoadedDoctrineNavigation {
  icons: string[]
  navigation: DoctrineNavigation
}

interface IDocumentFile {
  directory: string
  locale: string
  page: string
}

export function defineDirectory<T extends IDoctrineDirectoryConfig>(config: T): T {
  return config
}

export async function loadDoctrineNavigation(
  options: ILoadDoctrineNavigationOptions,
): Promise<ILoadedDoctrineNavigation> {
  const documents = await findDocuments(options.contentDirectory, options.locales)
  const icons = new Set<string>()
  const navigation: Record<string, readonly DoctrineNavigationNode[]> = {}

  await Promise.all(
    options.locales.names.map(async (locale) => {
      const localeDocuments = documents.filter((document) => document.locale === locale)
      if (localeDocuments.length === 0) {
        navigation[locale] = []
        return
      }
      const directories = relevantDirectories(localeDocuments)
      const documentKeys = new Set<string>()
      navigation[locale] = (
        await loadDirectory(
          '',
          locale,
          true,
          localeDocuments,
          directories,
          documentKeys,
          icons,
          options,
        )
      ).items
      if (options.command === 'build' && documentKeys.size !== localeDocuments.length) {
        throw new Error(`Navigation for ${locale} does not include every MDX document`)
      }
    }),
  )

  return { icons: [...icons].toSorted(), navigation }
}

async function loadDirectory(
  relativeDirectory: string,
  locale: string,
  root: boolean,
  documents: readonly IDocumentFile[],
  directories: ReadonlySet<string>,
  documentKeys: Set<string>,
  icons: Set<string>,
  options: ILoadDoctrineNavigationOptions,
): Promise<{ items: readonly DoctrineNavigationNode[]; icon?: string; title?: string }> {
  const directory = path.join(options.contentDirectory, relativeDirectory)
  const configFile = path.join(
    directory,
    locale === options.locales.default ? 'meta.ts' : `meta.${locale}.ts`,
  )
  const loaded = await loadConfigFromFile(
    { command: options.command, mode: options.command === 'build' ? 'production' : 'development' },
    configFile,
    options.root,
  )
  if (!loaded)
    throw new Error(`Unable to load navigation config: ${displayPath(options, configFile)}`)
  const config = validateDirectoryConfig(loaded.config, configFile, root, options)
  addIcon(config.icon, icons, configFile, options)

  const directDocuments = documents.filter((document) => document.directory === relativeDirectory)
  const directDirectories = [...directories].filter(
    (candidate) =>
      candidate !== relativeDirectory && parentDirectory(candidate) === relativeDirectory,
  )
  const pages = new Map(directDocuments.map((document) => [document.page, document]))
  const childDirectories = new Set(directDirectories)
  const referencedPages = new Set<string>()
  const referencedDirectories = new Set<string>()
  const items = await Promise.all(
    config.items.map(async (item): Promise<DoctrineNavigationNode | undefined> => {
      if ('page' in item) {
        const document = pages.get(item.page)
        if (!document) {
          if (options.command === 'serve') return undefined
          throw new Error(
            `Navigation page ${JSON.stringify(item.page)} does not match an ${locale} MDX file in ${displayPath(options, directory)}`,
          )
        }
        if (referencedPages.has(item.page)) {
          throw new Error(
            `Duplicate navigation page ${JSON.stringify(item.page)} in ${displayPath(options, configFile)}`,
          )
        }
        referencedPages.add(item.page)
        const documentKey = documentKeyFor(document)
        if (documentKeys.has(documentKey)) {
          throw new Error(`Duplicate document route: ${documentKey}`)
        }
        documentKeys.add(documentKey)
        addIcon(item.icon, icons, configFile, options)
        return {
          documentKey,
          ...(item.icon ? { icon: item.icon } : {}),
          title: item.title,
          type: 'page',
        }
      }

      const childRelativeDirectory = joinRelative(relativeDirectory, item.directory)
      if (!childDirectories.has(childRelativeDirectory)) {
        if (options.command === 'serve') return undefined
        throw new Error(
          `Navigation directory ${JSON.stringify(item.directory)} does not match an ${locale} content directory in ${displayPath(options, directory)}`,
        )
      }
      if (referencedDirectories.has(item.directory)) {
        throw new Error(
          `Duplicate navigation directory ${JSON.stringify(item.directory)} in ${displayPath(options, configFile)}`,
        )
      }
      referencedDirectories.add(item.directory)
      const child = await loadDirectory(
        childRelativeDirectory,
        locale,
        false,
        documents,
        directories,
        documentKeys,
        icons,
        options,
      )
      return {
        directory: childRelativeDirectory,
        ...(child.icon ? { icon: child.icon } : {}),
        items: child.items,
        title: child.title ?? item.directory,
        type: 'directory',
      }
    }),
  )

  if (options.command === 'build') {
    assertCompleteReferences(pages.keys(), referencedPages, 'page', locale, configFile, options)
    assertCompleteReferences(
      directDirectories.map((candidate) => path.basename(candidate)),
      referencedDirectories,
      'directory',
      locale,
      configFile,
      options,
    )
  }
  return {
    icon: config.icon,
    items: items.filter((item): item is DoctrineNavigationNode => item !== undefined),
    title: config.title,
  }
}

async function findDocuments(
  contentDirectory: string,
  locales: IDoctrineLocaleConfig,
): Promise<IDocumentFile[]> {
  const documents: IDocumentFile[] = []
  const identities = new Set<string>()

  async function visit(directory: string, relativeDirectory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true })
    await Promise.all(
      entries.map(async (entry) => {
        const relative = joinRelative(relativeDirectory, entry.name)
        if (entry.isDirectory()) {
          await visit(path.join(directory, entry.name), relative)
        } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
          const identity = documentIdentity(entry.name, locales)
          const key = `${identity.locale}\0${relativeDirectory}\0${identity.page}`
          if (identities.has(key)) {
            throw new Error(`Duplicate localized MDX document: ${relative}`)
          }
          identities.add(key)
          documents.push({ directory: relativeDirectory, ...identity })
        }
      }),
    )
  }

  await visit(contentDirectory, '')
  return documents
}

function documentIdentity(
  file: string,
  locales: IDoctrineLocaleConfig,
): { locale: string; page: string } {
  let page = file.slice(0, -'.mdx'.length)
  let locale = locales.default
  for (const candidate of locales.names.toSorted((left, right) => right.length - left.length)) {
    const suffix = `.${candidate}`
    if (!page.endsWith(suffix)) continue
    page = page.slice(0, -suffix.length)
    locale = candidate
    break
  }
  if (!page) throw new Error(`Invalid MDX filename: ${file}`)
  return { locale, page }
}

function relevantDirectories(documents: readonly IDocumentFile[]): Set<string> {
  const directories = new Set<string>([''])
  for (const document of documents) {
    let current = document.directory
    while (current) {
      directories.add(current)
      current = parentDirectory(current)
    }
  }
  return directories
}

function validateDirectoryConfig(
  value: unknown,
  file: string,
  root: boolean,
  options: ILoadDoctrineNavigationOptions,
): IDoctrineDirectoryConfig {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error(
      `Navigation config must export an object with an items array: ${displayPath(options, file)}`,
    )
  }
  if (!root && (typeof value.title !== 'string' || !value.title.trim())) {
    throw new Error(`Nested navigation config must define title: ${displayPath(options, file)}`)
  }
  if (value.icon !== undefined && typeof value.icon !== 'string') {
    throw new Error(`Navigation icon must be a string: ${displayPath(options, file)}`)
  }
  for (const item of value.items) {
    if (!isRecord(item) || 'page' in item === 'directory' in item) {
      throw new Error(
        `Each navigation item must define either page or directory: ${displayPath(options, file)}`,
      )
    }
    if ('page' in item) {
      if (typeof item.page !== 'string' || !item.page || item.page.includes('/')) {
        throw new Error(
          `Navigation page must be a direct MDX basename: ${displayPath(options, file)}`,
        )
      }
      if (typeof item.title !== 'string' || !item.title.trim()) {
        throw new Error(`Navigation page must define title: ${displayPath(options, file)}`)
      }
      if (item.icon !== undefined && typeof item.icon !== 'string') {
        throw new Error(`Navigation icon must be a string: ${displayPath(options, file)}`)
      }
    } else if (
      typeof item.directory !== 'string' ||
      !item.directory ||
      item.directory.includes('/') ||
      item.directory === '.' ||
      item.directory === '..'
    ) {
      throw new Error(
        `Navigation directory must be a direct child name: ${displayPath(options, file)}`,
      )
    }
  }
  return value as unknown as IDoctrineDirectoryConfig
}

function assertCompleteReferences(
  expected: Iterable<string>,
  actual: ReadonlySet<string>,
  kind: 'directory' | 'page',
  locale: string,
  configFile: string,
  options: ILoadDoctrineNavigationOptions,
): void {
  for (const name of expected) {
    if (!actual.has(name)) {
      throw new Error(
        `${displayPath(options, configFile)} is missing ${locale} ${kind} ${JSON.stringify(name)}`,
      )
    }
  }
}

function addIcon(
  icon: string | undefined,
  icons: Set<string>,
  file: string,
  options: ILoadDoctrineNavigationOptions,
): void {
  if (!icon) return
  if (!/^[$A-Z_a-z][$\w]*$/.test(icon)) {
    throw new Error(`Invalid icon export ${JSON.stringify(icon)} in ${displayPath(options, file)}`)
  }
  icons.add(icon)
}

function documentKeyFor(document: IDocumentFile): string {
  const page = document.page === 'index' || document.page === 'page' ? '' : document.page
  const slug = [document.directory, page].filter(Boolean).join('/') || '/'
  return `${document.locale}:${slug}`
}

function parentDirectory(directory: string): string {
  const parent = path.posix.dirname(directory)
  return parent === '.' ? '' : parent
}

function joinRelative(directory: string, name: string): string {
  return directory ? `${directory}/${name}` : name
}

function displayPath(options: ILoadDoctrineNavigationOptions, file: string): string {
  return path.relative(options.root, file) || '.'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
