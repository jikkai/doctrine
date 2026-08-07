import type { IDocumentRoute, IGeneratedDocument, IRuntimeConfig } from './types.js'
import { documentRoutePath, normalizeRoutePath } from './url.js'

export function createDocumentRoutes(
  documents: readonly IGeneratedDocument[],
  config: IRuntimeConfig,
): IDocumentRoute[] {
  const routes = documents.map((document) => {
    const locale = document.locale ?? config.locales.default
    const slug = document.slug ?? '/'
    const title = document.frontmatter.title
    const description = document.frontmatter.description
    const order = document.frontmatter.order
    if (typeof title !== 'string' || title.length === 0) {
      throw new Error(`Document ${document.key} must have a title`)
    }
    if (!config.locales.names.includes(locale)) {
      throw new Error(`Document ${document.key} uses unconfigured locale ${locale}`)
    }
    return {
      description: typeof description === 'string' ? description : undefined,
      document,
      locale,
      order: typeof order === 'number' && Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER,
      path: documentRoutePath(locale, config.locales.default, slug),
      slug,
      title,
    }
  })

  const paths = new Set<string>()
  for (const route of routes) {
    if (paths.has(route.path)) throw new Error(`Duplicate document route: ${route.path}`)
    paths.add(route.path)
  }

  return routes.toSorted(
    (left, right) =>
      config.locales.names.indexOf(left.locale) - config.locales.names.indexOf(right.locale) ||
      left.order - right.order ||
      left.title.localeCompare(right.title, left.locale),
  )
}

export function findDocumentRoute(
  routes: readonly IDocumentRoute[],
  pathname: string,
): IDocumentRoute | undefined {
  const normalized = normalizeRoutePath(pathname)
  return routes.find((route) => route.path === normalized)
}
