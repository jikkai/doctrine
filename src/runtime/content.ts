import type { DoctrineNavigationNode, INormalizedDoctrineNavigationPage } from '../navigation.js'
import type { IDocumentRoute, IGeneratedDocument, IRuntimeConfig } from './types.js'
import { documentRoutePath, normalizeRoutePath } from './url.js'

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
      routes.push({
        description: typeof description === 'string' ? description : undefined,
        document,
        locale,
        path: documentRoutePath(locale, config.locales.default, slug),
        slug,
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

  return routes
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
