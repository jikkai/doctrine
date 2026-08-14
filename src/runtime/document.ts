import type { IDocumentRoute, IPageAssets, IRuntimeConfig } from './types.js'

const THEME_SCRIPT = `(function(){var d=document.documentElement,t='';try{t=localStorage.getItem('doctrine-theme')||''}catch(e){}d.dataset.theme=t==='light'||t==='dark'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')})()`

export function htmlDocument(
  appHtml: string,
  config: IRuntimeConfig,
  routes: readonly IDocumentRoute[],
  route: IDocumentRoute | undefined,
  assets: IPageAssets,
): string {
  const locale = route?.locale ?? config.locales.default
  const siteTitle = config.title
  const title = route && route.title !== siteTitle ? `${route.title} · ${siteTitle}` : siteTitle
  const description = route?.description ?? config.description
  const canonical = route ? absoluteRouteUrl(config.siteUrl, route.path) : undefined
  const alternates = route
    ? routes
        .filter((candidate) => candidate.slug === route.slug)
        .map(
          (candidate) =>
            `<link rel="alternate" hreflang="${escapeHtml(candidate.locale)}" href="${escapeHtml(absoluteRouteUrl(config.siteUrl, candidate.path))}">`,
        )
    : []
  const defaultAlternate = route
    ? routes.find(
        (candidate) => candidate.slug === route.slug && candidate.locale === config.locales.default,
      )
    : undefined
  if (defaultAlternate) {
    alternates.push(
      `<link rel="alternate" hreflang="x-default" href="${escapeHtml(absoluteRouteUrl(config.siteUrl, defaultAlternate.path))}">`,
    )
  }

  const styles = assets.styles
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`)
    .join('')
  const scripts = assets.scripts
    .filter(Boolean)
    .map((src) => `<script type="module" src="${escapeHtml(src)}"></script>`)
    .join('')
  const canonicalLink = canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ''

  return `<!doctype html><html lang="${escapeHtml(locale)}" data-theme="light"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="generator" content="@amamo/doctrine"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta data-pagefind-meta="title" content="${escapeHtml(route?.title ?? siteTitle)}">${canonicalLink}${alternates.join('')}${styles}<script>${THEME_SCRIPT}</script></head><body><div id="doctrine-root">${appHtml}</div>${scripts}</body></html>`
}

function absoluteRouteUrl(siteUrl: string, routePath: string): string {
  return new URL(routePath.slice(1), siteUrl).href
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
