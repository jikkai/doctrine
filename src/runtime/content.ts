import type { DoctrineNavigationNode, INormalizedDoctrineNavigationPage } from '../navigation.js'
import type {
  IDocumentRoute,
  IDocumentSource,
  IGeneratedDocument,
  IRuntimeConfig,
} from './types.js'
import { documentMarkdownPath, documentRoutePath, normalizeRoutePath } from './url.js'

export function createDocumentRoutes(
  documents: readonly IGeneratedDocument[],
  config: IRuntimeConfig,
): IDocumentRoute[] {
  const documentsByKey = new Map(documents.map((document) => [document.key, document]))
  const routes: IDocumentRoute[] = []

  for (const locale of config.locales.names) {
    for (const page of flattenNavigation(config.navigation[locale] ?? [])) {
      const document = documentsByKey.get(page.documentKey)
      if (!document) {
        if (config.dev) continue
        throw new Error(`Navigation references missing document ${page.documentKey}`)
      }
      documentsByKey.delete(page.documentKey)
      const documentLocale = document.locale ?? config.locales.default
      if (documentLocale !== locale) {
        throw new Error(`Navigation locale does not match document ${document.key}`)
      }
      const slug = document.slug ?? '/'
      const description = document.frontmatter.description
      const routePath = documentRoutePath(locale, config.locales.default, slug)
      routes.push({
        description: typeof description === 'string' ? description : page.description,
        document,
        locale,
        path: routePath,
        slug,
        ...(config.pageActions && page.sourcePath
          ? { source: createDocumentSource(page.sourcePath, routePath, config) }
          : {}),
        standalone: document.standalone === true,
        title: page.title,
      })
    }
  }

  if (!config.dev && documentsByKey.size > 0) {
    throw new Error(`Navigation is missing document ${documentsByKey.keys().next().value}`)
  }

  const paths = new Set<string>()
  for (const route of routes) {
    if (paths.has(route.path)) throw new Error(`Duplicate document route: ${route.path}`)
    paths.add(route.path)
  }

  assertOutputCompatibility(routes)
  return routes
}

function createDocumentSource(
  sourcePath: string,
  routePath: string,
  config: IRuntimeConfig,
): IDocumentSource {
  const githubUrl = githubSourceUrl(config, sourcePath)
  return {
    ...(githubUrl ? { githubUrl } : {}),
    markdownPath: documentMarkdownPath(routePath),
    sourcePath,
  }
}

function githubSourceUrl(config: IRuntimeConfig, sourcePath: string): string | undefined {
  if (!config.githubUrl || config.githubSourceRoot === undefined) return undefined
  const repository = new URL(config.githubUrl)
  repository.hash = ''
  repository.search = ''
  repository.pathname = repository.pathname.replace(/\/$/, '').replace(/\.git$/, '')
  const fullSourcePath = [config.githubSourceRoot, sourcePath]
    .filter(Boolean)
    .flatMap((segment) => segment.split('/'))
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  repository.pathname = `${repository.pathname}/blob/HEAD/${fullSourcePath}`
  return repository.href
}

function assertOutputCompatibility(routes: readonly IDocumentRoute[]): void {
  const targets = [
    ...routes.flatMap((route) => [
      {
        file: outputFile([...outputSegments(route.path), 'index.html']),
        route: route.path,
        type: 'HTML',
      },
      ...(route.source
        ? [
            {
              file: outputFile(outputSegments(route.source.markdownPath)),
              route: route.path,
              type: 'Markdown',
            },
          ]
        : []),
    ]),
    { file: '404.html', route: 'the not-found fallback', type: 'HTML' },
    { file: '.vite', route: 'Vite metadata', type: 'reserved' },
    { file: 'pagefind', route: 'Pagefind search assets', type: 'reserved' },
  ]
  for (let index = 0; index < targets.length; index += 1) {
    const output = targets[index]
    if (!output) continue
    for (let candidateIndex = index + 1; candidateIndex < targets.length; candidateIndex += 1) {
      const candidate = targets[candidateIndex]
      if (!candidate || !outputFilesConflict(output.file, candidate.file)) continue
      throw new Error(
        `${output.type} output for ${output.route} at ${output.file} conflicts with ${candidate.type} output for ${candidate.route} at ${candidate.file}`,
      )
    }
  }
}

function outputSegments(pathname: string): string[] {
  return pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
}

function outputFile(segments: readonly string[]): string {
  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\'),
    )
  ) {
    throw new Error(`Unsafe document output path: ${segments.join('/')}`)
  }
  return segments.join('/')
}

function outputFilesConflict(left: string, right: string): boolean {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`)
}

function flattenNavigation(
  items: readonly DoctrineNavigationNode[],
): INormalizedDoctrineNavigationPage[] {
  return items.flatMap((item) => (item.type === 'page' ? [item] : flattenNavigation(item.items)))
}

export function findDocumentRoute(
  routes: readonly IDocumentRoute[],
  pathname: string,
): IDocumentRoute | undefined {
  const normalized = normalizeRoutePath(pathname)
  return routes.find((route) => route.path === normalized)
}
