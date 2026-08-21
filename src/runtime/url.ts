export function withBase(base: string, href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  return `${base}${href.slice(1)}`
}

export function withoutBase(base: string, pathname: string): string | undefined {
  if (!pathname.startsWith(base)) return undefined
  return normalizeRoutePath(`/${pathname.slice(base.length)}`)
}

export function documentRoutePath(locale: string, defaultLocale: string, slug: string): string {
  const localePrefix = locale === defaultLocale ? '' : `/${encodeURIComponent(locale)}`
  const slugPath = slug === '/' ? '' : `/${encodeSlug(slug)}`
  return normalizeRoutePath(`${localePrefix}${slugPath}`)
}

export function documentMarkdownPath(routePath: string): string {
  const route = normalizeRoutePath(routePath)
  if (route === '/') return '/index.md'
  const segments = route.split('/').filter(Boolean)
  return segments.every(isIndexSegment)
    ? `/${segments.join('/')}/index.md`
    : `${route.slice(0, -1)}.md`
}

export function documentRouteFromMarkdownPath(markdownPath: string): string | undefined {
  if (!markdownPath.startsWith('/') || markdownPath.endsWith('/') || markdownPath.includes('//')) {
    return undefined
  }
  const pathname = `/${markdownPath.split('/').filter(Boolean).join('/')}`
  if (pathname === '/index.md') return '/'
  if (!pathname.endsWith('.md')) return undefined
  const segments = pathname.split('/').filter(Boolean)
  let route: string
  if (
    segments.at(-1) === 'index.md' &&
    segments.length > 1 &&
    segments.slice(0, -1).every(isIndexSegment)
  ) {
    route = normalizeRoutePath(`/${segments.slice(0, -1).join('/')}`)
  } else {
    route = normalizeRoutePath(pathname.slice(0, -'.md'.length))
  }
  return documentMarkdownPath(route) === markdownPath ? route : undefined
}

export function normalizeRoutePath(value: string): string {
  const pathname = `/${value.split('/').filter(Boolean).join('/')}`
  return pathname === '/' ? pathname : `${pathname}/`
}

function encodeSlug(slug: string): string {
  return slug
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function isIndexSegment(segment: string): boolean {
  return segment.toLowerCase() === 'index'
}
