import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

import { loadConfigFromFile } from 'vite'

import type { IDoctrineLocaleConfig } from './config.js'

export interface IDoctrinePageNavigationItem {
  description?: string
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
  description?: string
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
  tsxPages: IDoctrineTsxPage[]
}

export interface IDoctrineTsxPage {
  documentKey: string
  file: string
  locale: string
  slug: string
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
  const tsxPages = new Map<string, IDoctrineTsxPage>()

  await Promise.all(
    options.locales.names.map(async (locale) => {
      const localeDocuments = documents.filter((document) => document.locale === locale)
      const rootConfig = path.join(
        options.contentDirectory,
        locale === options.locales.default ? 'meta.ts' : `meta.${locale}.ts`,
      )
      if (localeDocuments.length === 0 && !(await isFile(rootConfig))) {
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
          tsxPages,
          options,
        )
      ).items
      if (
        options.command === 'build' &&
        localeDocuments.some((document) => !documentKeys.has(documentKeyFor(document)))
      ) {
        throw new Error(`Navigation for ${locale} does not include every MDX document`)
      }
    }),
  )

  return {
    icons: [...icons].toSorted(),
    navigation,
    tsxPages: [...tsxPages.values()].toSorted((left, right) =>
      left.documentKey.localeCompare(right.documentKey),
    ),
  }
}

async function loadDirectory(
  relativeDirectory: string,
  locale: string,
  root: boolean,
  documents: readonly IDocumentFile[],
  directories: ReadonlySet<string>,
  documentKeys: Set<string>,
  icons: Set<string>,
  tsxPages: Map<string, IDoctrineTsxPage>,
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
        const tsxFile = await findTsxPage(directory, item.page, locale, options.locales.default)
        if (document && tsxFile) {
          throw new Error(
            `Navigation page ${JSON.stringify(item.page)} matches both MDX and TSX in ${displayPath(options, directory)}`,
          )
        }
        if (!document && !tsxFile) {
          if (options.command === 'serve') return undefined
          throw new Error(
            `Navigation page ${JSON.stringify(item.page)} does not match an ${locale} MDX or TSX file in ${displayPath(options, directory)}`,
          )
        }
        if (referencedPages.has(item.page)) {
          throw new Error(
            `Duplicate navigation page ${JSON.stringify(item.page)} in ${displayPath(options, configFile)}`,
          )
        }
        referencedPages.add(item.page)
        const identity = document ?? { directory: relativeDirectory, locale, page: item.page }
        const documentKey = documentKeyFor(identity)
        if (documentKeys.has(documentKey)) {
          throw new Error(`Duplicate document route: ${documentKey}`)
        }
        documentKeys.add(documentKey)
        if (tsxFile) {
          tsxPages.set(documentKey, {
            documentKey,
            file: tsxFile,
            locale,
            slug: documentSlugFor(identity),
          })
        }
        addIcon(item.icon, icons, configFile, options)
        return {
          ...(item.description ? { description: item.description } : {}),
          documentKey,
          ...(item.icon ? { icon: item.icon } : {}),
          title: item.title,
          type: 'page',
        }
      }

      const childRelativeDirectory = joinRelative(relativeDirectory, item.directory)
      if (
        !childDirectories.has(childRelativeDirectory) &&
        !(await isDirectory(path.join(options.contentDirectory, childRelativeDirectory)))
      ) {
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
        tsxPages,
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
          `Navigation page must be a direct MDX or TSX basename: ${displayPath(options, file)}`,
        )
      }
      if (typeof item.title !== 'string' || !item.title.trim()) {
        throw new Error(`Navigation page must define title: ${displayPath(options, file)}`)
      }
      if (
        item.description !== undefined &&
        (typeof item.description !== 'string' || !item.description.trim())
      ) {
        throw new Error(
          `Navigation description must be a non-empty string: ${displayPath(options, file)}`,
        )
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
  return `${document.locale}:${documentSlugFor(document).replace(/^\//, '').replace(/\/$/, '') || '/'}`
}

function documentSlugFor(document: IDocumentFile): string {
  const page = document.page === 'index' || document.page === 'page' ? '' : document.page
  const slug = [document.directory, page].filter(Boolean).join('/') || '/'
  return slug === '/' ? slug : `/${slug}/`
}

async function findTsxPage(
  directory: string,
  page: string,
  locale: string,
  defaultLocale: string,
): Promise<string | undefined> {
  const name = locale === defaultLocale ? `${page}.tsx` : `${page}.${locale}.tsx`
  const file = path.join(directory, name)
  const value = await stat(file).catch(() => undefined)
  return value?.isFile() ? file : undefined
}

async function isDirectory(directory: string): Promise<boolean> {
  return (await stat(directory).catch(() => undefined))?.isDirectory() ?? false
}

async function isFile(file: string): Promise<boolean> {
  return (await stat(file).catch(() => undefined))?.isFile() ?? false
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
