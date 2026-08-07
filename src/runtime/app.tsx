import type { ChangeEvent, ComponentProps, ComponentType } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Languages, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { createContext, useContext, useEffect, useState } from 'react'

import type { IDoctrineComponents } from '../config.js'
import type { IDocumentRoute, IMdxContentProps, IRuntimeConfig } from './types.js'
import { builtinMdxComponents } from './components/mdx.js'
import { Button } from './components/ui/button.js'
import { DialogSurface } from './components/ui/dialog-surface.js'
import { localizedText } from './i18n.js'
import { withBase } from './url.js'

export interface IAppProps {
  Content?: ComponentType<IMdxContentProps>
  components: IDoctrineComponents
  config: IRuntimeConfig
  route?: IDocumentRoute
  routes: readonly IDocumentRoute[]
}

interface IPagefindResultData {
  excerpt: string
  meta: Readonly<Record<string, string>>
  url: string
}

interface IPagefindResult {
  data: () => Promise<IPagefindResultData>
}

interface IPagefindModule {
  options: (options: { baseUrl: string }) => Promise<void>
  search: (query: string) => Promise<{ results: IPagefindResult[] }>
}

interface ILabels {
  close: string
  language: string
  menu: string
  noResults: string
  notFound: string
  notFoundDescription: string
  search: string
  searchPlaceholder: string
  theme: string
}

const LABELS: Readonly<Record<'en' | 'zh', ILabels>> = {
  en: {
    close: 'Close',
    language: 'Language',
    menu: 'Menu',
    noResults: 'No results found.',
    notFound: 'Page not found',
    notFoundDescription: 'The page may have moved or does not exist.',
    search: 'Search',
    searchPlaceholder: 'Search documentation…',
    theme: 'Toggle color theme',
  },
  zh: {
    close: '关闭',
    language: '语言',
    menu: '菜单',
    noResults: '没有找到结果。',
    notFound: '页面不存在',
    notFoundDescription: '该页面可能已移动，或从未存在。',
    search: '搜索',
    searchPlaceholder: '搜索文档…',
    theme: '切换颜色主题',
  },
}

const BaseContext = createContext('/')
let pagefindModule: Promise<IPagefindModule> | undefined

function labelsFor(locale: string): ILabels {
  return locale.toLowerCase().startsWith('zh') ? LABELS.zh : LABELS.en
}

async function loadPagefind(base: string): Promise<IPagefindModule> {
  pagefindModule ??= import(
    /* @vite-ignore */ `${base}pagefind/pagefind.js`
  ) as Promise<IPagefindModule>
  const module = await pagefindModule
  await module.options({ baseUrl: base })
  return module
}

function MdxLink({ children, href = '', ...props }: ComponentProps<'a'>) {
  const base = useContext(BaseContext)
  const external = /^(?:[a-z]+:)?\/\//i.test(href)
  return (
    <a
      href={withBase(base, href)}
      rel={external ? 'noreferrer' : undefined}
      target={external ? '_blank' : undefined}
      {...props}
    >
      {children}
    </a>
  )
}

function Navigation({
  current,
  mobile,
  routes,
}: {
  current?: IDocumentRoute
  mobile?: boolean
  routes: readonly IDocumentRoute[]
}) {
  const base = useContext(BaseContext)
  return (
    <nav aria-label="Documentation" className={mobile ? 'p-4' : 'py-6 pr-5'} data-slot="navigation">
      <ul className="space-y-1">
        {routes.map((route) => (
          <li key={route.path}>
            <a
              aria-current={current?.path === route.path ? 'page' : undefined}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
              href={withBase(base, route.path)}
            >
              {route.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function MobileNavigation({
  current,
  labels,
  routes,
}: {
  current?: IDocumentRoute
  labels: ILabels
  routes: readonly IDocumentRoute[]
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={labels.menu}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <Menu aria-hidden="true" className="size-4" />
      </Dialog.Trigger>
      <DialogSurface className="max-w-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Dialog.Title className="font-semibold">{labels.menu}</Dialog.Title>
          <Dialog.Close
            aria-label={labels.close}
            className="rounded-md p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="size-4" />
          </Dialog.Close>
        </div>
        <Navigation current={current} mobile routes={routes} />
      </DialogSurface>
    </Dialog.Root>
  )
}

function LocaleSwitcher({
  config,
  label,
  route,
  routes,
}: {
  config: IRuntimeConfig
  label: string
  route?: IDocumentRoute
  routes: readonly IDocumentRoute[]
}) {
  const translations = route
    ? routes.filter((candidate) => candidate.slug === route.slug)
    : routes.filter((candidate) => candidate.slug === '/')
  if (translations.length < 2) return null

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    window.location.assign(event.target.value)
  }

  const value = withBase(config.base, route?.path ?? translations[0]?.path ?? '/')

  return (
    <div className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
      <Languages aria-hidden="true" className="pointer-events-none size-4" />
      <select
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={handleChange}
        value={value}
      >
        {translations.map((translation) => (
          <option key={translation.locale} value={withBase(config.base, translation.path)}>
            {config.locales.labels?.[translation.locale] ?? translation.locale}
          </option>
        ))}
      </select>
    </div>
  )
}

function ThemeToggle({ label }: { label: string }) {
  function handleClick() {
    const current = document.documentElement.dataset.theme
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('doctrine-theme', next)
  }

  return (
    <Button
      aria-label={label}
      className="w-9 shrink-0 px-0"
      onClick={handleClick}
      variant="outline"
    >
      <Sun aria-hidden="true" className="theme-icon-light size-4" />
      <Moon aria-hidden="true" className="theme-icon-dark size-4" />
    </Button>
  )
}

function SearchDialog({ config, labels }: { config: IRuntimeConfig; labels: ILabels }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IPagefindResultData[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle')

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
  }

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value)
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const value = query.trim()
    if (!value) {
      setResults([])
      setStatus('idle')
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      setStatus('loading')
      loadPagefind(config.base)
        .then((pagefind) => pagefind.search(value))
        .then((response) =>
          Promise.all(response.results.slice(0, 8).map((result) => result.data())),
        )
        .then((nextResults) => {
          if (cancelled) return
          setResults(nextResults)
          setStatus('ready')
        })
        .catch((error: unknown) => {
          console.error(error)
          if (!cancelled) {
            setResults([])
            setStatus('ready')
          }
        })
    }, 120)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [config.base, query])

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Trigger
        aria-label={labels.search}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-52 sm:justify-start sm:px-3"
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">{labels.search}</span>
        <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Dialog.Trigger>
      <DialogSurface className="max-w-2xl overflow-hidden">
        <Dialog.Title className="sr-only">{labels.search}</Dialog.Title>
        <Dialog.Description className="sr-only">{labels.searchPlaceholder}</Dialog.Description>
        <div className="flex items-center border-b border-border px-4">
          <Search aria-hidden="true" className="size-4 text-muted-foreground" />
          <input
            aria-label={labels.search}
            autoComplete="off"
            className="h-14 flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground"
            onChange={handleQueryChange}
            placeholder={labels.searchPlaceholder}
            value={query}
          />
          <Dialog.Close
            aria-label={labels.close}
            className="rounded-md p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="size-4" />
          </Dialog.Close>
        </div>
        <div aria-live="polite" className="max-h-[55vh] min-h-24 overflow-y-auto p-2">
          {status === 'loading' && <p className="p-4 text-sm text-muted-foreground">…</p>}
          {status === 'ready' && results.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">{labels.noResults}</p>
          )}
          {results.map((result) => (
            <a className="block rounded-lg p-3 hover:bg-muted" href={result.url} key={result.url}>
              <strong className="block text-sm">{result.meta.title ?? result.url}</strong>
              <span
                className="mt-1 block text-sm text-muted-foreground [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-foreground"
                dangerouslySetInnerHTML={{ __html: result.excerpt }}
              />
            </a>
          ))}
        </div>
      </DialogSurface>
    </Dialog.Root>
  )
}

export function App({ Content, components, config, route, routes }: IAppProps) {
  const locale = route?.locale ?? config.locales.default
  const labels = labelsFor(locale)
  const localeRoutes = routes.filter((candidate) => candidate.locale === locale)
  const home = localeRoutes.find((candidate) => candidate.slug === '/') ?? localeRoutes[0]
  const siteTitle = localizedText(config.title, locale, config.locales.default)
  const mdxComponents: IDoctrineComponents = {
    a: MdxLink,
    ...builtinMdxComponents,
    ...components,
  }

  return (
    <BaseContext value={config.base}>
      <header
        className="sticky top-0 z-40 h-[var(--doctrine-header-height)] border-b border-border bg-background/90 backdrop-blur"
        data-pagefind-ignore
        data-slot="header"
      >
        <div
          className="mx-auto flex h-full max-w-screen-2xl items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-8"
          data-slot="header-inner"
        >
          <MobileNavigation current={route} labels={labels} routes={localeRoutes} />
          <a
            className="min-w-0 flex-1 truncate font-semibold tracking-tight"
            data-slot="brand"
            href={withBase(config.base, home?.path ?? '/')}
          >
            {siteTitle}
          </a>
          <SearchDialog config={config} labels={labels} />
          <LocaleSwitcher config={config} label={labels.language} route={route} routes={routes} />
          <ThemeToggle label={labels.theme} />
        </div>
      </header>
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 px-4 lg:grid-cols-[var(--doctrine-sidebar-width)_minmax(0,1fr)] lg:px-8">
        <aside
          className="sticky top-[var(--doctrine-header-height)] hidden h-[calc(100vh-var(--doctrine-header-height))] overflow-y-auto border-r border-border lg:block"
          data-pagefind-ignore
          data-slot="sidebar"
        >
          <Navigation current={route} routes={localeRoutes} />
        </aside>
        <main className="min-w-0 px-0 py-10 sm:px-6 lg:px-12 lg:py-14" data-slot="main">
          {route && Content ? (
            <article
              className="doctrine-prose mx-auto max-w-[var(--doctrine-content-width)]"
              data-pagefind-body
              data-slot="content"
            >
              <Content components={mdxComponents} />
            </article>
          ) : (
            <div className="mx-auto max-w-3xl py-20 text-center">
              <p className="text-sm font-medium text-muted-foreground">404</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">{labels.notFound}</h1>
              <p className="mt-4 text-muted-foreground">{labels.notFoundDescription}</p>
              <a
                className="mt-8 inline-block font-medium underline underline-offset-4"
                href={withBase(config.base, home?.path ?? '/')}
              >
                {siteTitle}
              </a>
            </div>
          )}
        </main>
      </div>
    </BaseContext>
  )
}
