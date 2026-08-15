import type { ChangeEvent, ComponentProps, ComponentType, ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Select } from '@base-ui/react/select'
import {
  CheckIcon,
  LanguagesIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  XIcon,
} from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import type { IDoctrineComponents } from '../config.js'
import type { DoctrineNavigationNode } from '../navigation.js'
import type { DoctrineIcons, IDocumentRoute, IMdxContentProps, IRuntimeConfig } from './types.js'

import { DoctrineLocaleContext } from './components/mdx/context.js'
import { builtinMdxComponents } from './components/mdx/registry.js'
import { TableOfContents } from './components/table-of-contents.js'
import { Button } from './components/ui/button.js'
import { DialogSurface } from './components/ui/dialog-surface.js'
import { withBase } from './url.js'

export interface IAppProps {
  Content?: ComponentType<IMdxContentProps>
  components: IDoctrineComponents
  config: IRuntimeConfig
  icons: DoctrineIcons
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
  documentation: string
  language: string
  menu: string
  noResults: string
  notFound: string
  notFoundDescription: string
  next: string
  onThisPage: string
  pageNavigation: string
  previous: string
  search: string
  searchError: string
  searchHint: string
  searchLoading: string
  searchPlaceholder: string
  skipToContent: string
  theme: string
}

const LABELS: Readonly<Record<'en' | 'zh', ILabels>> = {
  en: {
    close: 'Close',
    documentation: 'Documentation',
    language: 'Language',
    menu: 'Menu',
    noResults: 'No results found.',
    notFound: 'Page not found',
    notFoundDescription: 'The page may have moved or does not exist.',
    next: 'Next',
    onThisPage: 'On This Page',
    pageNavigation: 'Page navigation',
    previous: 'Previous',
    search: 'Search',
    searchError: 'Search is unavailable. Try again in a moment.',
    searchHint: 'Type a word or phrase to search every page.',
    searchLoading: 'Searching…',
    searchPlaceholder: 'Search documentation…',
    skipToContent: 'Skip to content',
    theme: 'Toggle color theme',
  },
  zh: {
    close: '关闭',
    documentation: '文档',
    language: '语言',
    menu: '菜单',
    noResults: '没有找到结果。',
    notFound: '页面不存在',
    notFoundDescription: '该页面可能已移动，或从未存在。',
    next: '下一篇',
    onThisPage: '本页目录',
    pageNavigation: '页面导航',
    previous: '上一篇',
    search: '搜索',
    searchError: '暂时无法搜索，请稍后重试。',
    searchHint: '输入词语，搜索全部文档。',
    searchLoading: '正在搜索…',
    searchPlaceholder: '搜索文档…',
    skipToContent: '跳到正文',
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
  icons,
  items,
  label,
  mobile,
  routes,
}: {
  current?: IDocumentRoute
  icons: DoctrineIcons
  items: readonly DoctrineNavigationNode[]
  label: string
  mobile?: boolean
  routes: readonly IDocumentRoute[]
}) {
  const base = useContext(BaseContext)

  function renderItems(nodes: readonly DoctrineNavigationNode[], nested = false): ReactNode {
    return (
      <ul
        className={nested ? 'mt-1 ml-2 space-y-0.5 border-l border-border/60 pl-3' : 'space-y-0.5'}
      >
        {nodes.map((item) => {
          const Icon = item.icon ? icons[item.icon] : undefined
          if (item.type === 'directory') {
            return (
              <li className="pt-5 first:pt-0" key={item.directory}>
                <div className="flex items-center gap-2 px-3 py-2 text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  {Icon && <Icon aria-hidden="true" className="size-3.5 shrink-0" />}
                  <span>{item.title}</span>
                </div>
                {renderItems(item.items, true)}
              </li>
            )
          }

          const route = routes.find((candidate) => candidate.document.key === item.documentKey)
          if (!route || route.slug === '/') return null
          return (
            <li key={item.documentKey}>
              <a
                aria-current={current?.path === route.path ? 'page' : undefined}
                className={`relative flex items-center gap-2 rounded-sm px-3 py-2 text-[0.8125rem] leading-5 text-muted-foreground transition-colors before:absolute before:inset-y-2 before:-left-px before:w-px before:bg-transparent hover:bg-muted/60 hover:text-foreground aria-[current=page]:bg-accent/55 aria-[current=page]:font-medium aria-[current=page]:text-accent-foreground aria-[current=page]:before:bg-primary ${mobile ? 'min-h-11 text-sm' : 'min-h-9'}`}
                href={withBase(base, route.path)}
              >
                {Icon && <Icon aria-hidden="true" className="size-3.5 shrink-0" />}
                <span>{item.title}</span>
              </a>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <nav
      aria-label={label}
      className={mobile ? 'max-h-[calc(100dvh-4.5rem)] overflow-y-auto p-4' : 'py-8 pr-6'}
      data-slot="navigation"
    >
      {renderItems(items)}
    </nav>
  )
}

function MobileNavigation({
  current,
  icons,
  items,
  labels,
  routes,
}: {
  current?: IDocumentRoute
  icons: DoctrineIcons
  items: readonly DoctrineNavigationNode[]
  labels: ILabels
  routes: readonly IDocumentRoute[]
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={labels.menu}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9 sm:w-9 lg:hidden!"
      >
        <MenuIcon aria-hidden="true" className="size-4" />
      </Dialog.Trigger>
      <DialogSurface className="max-w-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Dialog.Title className="font-semibold">{labels.menu}</Dialog.Title>
          <Dialog.Close
            aria-label={labels.close}
            className="inline-flex size-11 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:size-9"
          >
            <XIcon aria-hidden="true" className="size-4" />
          </Dialog.Close>
        </div>
        <Navigation
          current={current}
          icons={icons}
          items={items}
          label={labels.documentation}
          mobile
          routes={routes}
        />
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

  function handleValueChange(nextValue: string | null) {
    if (nextValue) window.location.assign(nextValue)
  }

  const value = withBase(config.base, route?.path ?? translations[0]?.path ?? '/')
  const items = translations.map((translation) => ({
    label: config.locales.labels?.[translation.locale] ?? translation.locale,
    value: withBase(config.base, translation.path),
  }))

  return (
    <Select.Root items={items} onValueChange={handleValueChange} value={value}>
      <Select.Trigger
        aria-label={label}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9 sm:w-9"
        data-slot="locale-switcher"
      >
        <LanguagesIcon aria-hidden="true" className="size-4" />
        <Select.Value className="sr-only" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner align="end" className="z-50 outline-none" sideOffset={4}>
          <Select.Popup className="min-w-36 rounded-lg border border-border/70 bg-card p-1 text-card-foreground shadow-lg outline-none">
            <Select.List>
              {items.map((item) => (
                <Select.Item
                  className="grid min-h-9 cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-accent/70 data-[highlighted]:text-accent-foreground"
                  key={item.value}
                  value={item.value}
                >
                  <Select.ItemIndicator className="col-start-1">
                    <CheckIcon aria-hidden="true" className="size-4" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="col-start-2">{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
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
      className="h-11 w-11 shrink-0 border-transparent! px-0! shadow-none! sm:h-9 sm:w-9"
      onClick={handleClick}
      variant="outline"
    >
      <SunIcon aria-hidden="true" className="theme-icon-light size-4" />
      <MoonIcon aria-hidden="true" className="theme-icon-dark size-4" />
    </Button>
  )
}

function SearchDialog({ config, labels }: { config: IRuntimeConfig; labels: ILabels }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IPagefindResultData[]>([])
  const [status, setStatus] = useState<'error' | 'idle' | 'loading' | 'ready'>('idle')

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
            setStatus('error')
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
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-md border border-transparent bg-transparent text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9 sm:w-52 sm:justify-start sm:bg-muted/55 sm:px-3"
      >
        <SearchIcon aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">{labels.search}</span>
        <kbd className="ml-auto hidden border-0 bg-transparent p-0 text-[0.6875rem] font-normal text-muted-foreground sm:inline">
          ⌘ K
        </kbd>
      </Dialog.Trigger>
      <DialogSurface className="max-w-2xl overflow-hidden" initialFocus={inputRef}>
        <Dialog.Title className="sr-only">{labels.search}</Dialog.Title>
        <Dialog.Description className="sr-only">{labels.searchPlaceholder}</Dialog.Description>
        <div className="flex items-center border-b border-border/70 px-4">
          <SearchIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          <input
            aria-label={labels.search}
            autoComplete="off"
            className="h-14 min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground"
            onChange={handleQueryChange}
            placeholder={labels.searchPlaceholder}
            ref={inputRef}
            value={query}
          />
          <Dialog.Close
            aria-label={labels.close}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:size-9"
          >
            <XIcon aria-hidden="true" className="size-4" />
          </Dialog.Close>
        </div>
        <div
          aria-busy={status === 'loading'}
          aria-live="polite"
          className="max-h-[min(55dvh,28rem)] min-h-28 overflow-y-auto p-2"
        >
          {status === 'idle' && (
            <p className="p-4 text-sm leading-6 text-muted-foreground">{labels.searchHint}</p>
          )}
          {status === 'loading' && (
            <p className="p-4 text-sm text-muted-foreground">{labels.searchLoading}</p>
          )}
          {status === 'error' && (
            <p className="p-4 text-sm text-muted-foreground">{labels.searchError}</p>
          )}
          {status === 'ready' && results.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">{labels.noResults}</p>
          )}
          {results.map((result) => (
            <a
              className="block rounded-md p-3 transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href={result.url}
              key={result.url}
            >
              <strong className="block text-sm">{result.meta.title ?? result.url}</strong>
              <span
                className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-foreground"
                dangerouslySetInnerHTML={{ __html: result.excerpt }}
              />
            </a>
          ))}
        </div>
      </DialogSurface>
    </Dialog.Root>
  )
}

export function App({ Content, components, config, icons, route, routes }: IAppProps) {
  const locale = route?.locale ?? config.locales.default
  const labels = labelsFor(locale)
  const localeRoutes = routes.filter((candidate) => candidate.locale === locale)
  const navigation = config.navigation[locale] ?? []
  const home = localeRoutes.find((candidate) => candidate.slug === '/') ?? localeRoutes[0]
  const routeIndex = route
    ? localeRoutes.findIndex((candidate) => candidate.path === route.path)
    : -1
  const previousRoute = routeIndex > 0 ? localeRoutes[routeIndex - 1] : undefined
  const nextRoute = routeIndex >= 0 ? localeRoutes[routeIndex + 1] : undefined
  const documentationHome = localeRoutes.find((candidate) => !candidate.standalone)
  const siteTitle = config.title
  const mdxComponents: IDoctrineComponents = {
    a: MdxLink,
    ...builtinMdxComponents,
    ...components,
  }

  function renderFooter() {
    if (!config.copyright) return null
    return (
      <footer
        className="mx-auto max-w-[var(--doctrine-content-width)] border-t border-border/60 py-10 text-center text-xs tracking-wide text-muted-foreground"
        data-pagefind-ignore
        data-slot="footer"
      >
        {config.copyright}
      </footer>
    )
  }

  function renderPageNavigation() {
    if (!previousRoute && !nextRoute) return null
    return (
      <nav
        aria-label={labels.pageNavigation}
        className="mx-auto mt-20 grid max-w-[var(--doctrine-content-width)] grid-cols-2 gap-6"
        data-pagefind-ignore
        data-slot="page-navigation"
      >
        {previousRoute ? (
          <a
            className="group min-w-0 border-t border-border/60 pt-4 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href={withBase(config.base, previousRoute.path)}
          >
            <span className="block text-xs text-muted-foreground">← {labels.previous}</span>
            <strong className="mt-1 block truncate text-sm font-semibold group-hover:text-primary">
              {previousRoute.title}
            </strong>
          </a>
        ) : (
          <span />
        )}
        {nextRoute && (
          <a
            className="group min-w-0 border-t border-border/60 pt-4 text-right transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href={withBase(config.base, nextRoute.path)}
          >
            <span className="block text-xs text-muted-foreground">{labels.next} →</span>
            <strong className="mt-1 block truncate text-sm font-semibold group-hover:text-primary">
              {nextRoute.title}
            </strong>
          </a>
        )}
      </nav>
    )
  }

  return (
    <BaseContext value={config.base}>
      <a
        className="fixed top-3 left-3 z-[60] -translate-y-20 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 motion-reduce:transition-none"
        href="#main-content"
      >
        {labels.skipToContent}
      </a>
      <header
        className="sticky top-0 z-40 h-[var(--doctrine-header-height)] bg-background"
        data-pagefind-ignore
        data-slot="header"
      >
        <div
          className="relative mx-auto flex h-full max-w-screen-2xl items-center gap-0 px-2 after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-border/55 min-[23rem]:gap-1 min-[23rem]:px-3 min-[23rem]:after:inset-x-3 sm:gap-2 sm:px-4 sm:after:inset-x-4 lg:px-8 lg:after:inset-x-8"
          data-slot="header-inner"
        >
          <MobileNavigation
            current={route}
            icons={icons}
            items={navigation}
            labels={labels}
            routes={localeRoutes}
          />
          <div className="mr-auto flex min-w-0 items-center gap-2">
            <a
              className="group relative inline-flex min-h-11 min-w-0 shrink items-center truncate rounded-sm text-sm font-semibold tracking-[-0.015em] after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-right after:scale-x-0 after:bg-current after:opacity-40 after:transition-transform after:duration-200 hover:after:origin-left hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:after:transition-none sm:min-h-9 sm:text-[0.9375rem]"
              data-slot="brand"
              href={withBase(config.base, home?.path ?? '/')}
            >
              {siteTitle}
            </a>
            {documentationHome && (
              <nav
                aria-label={labels.documentation}
                className="ml-4 hidden shrink-0 lg:flex"
                data-slot="header-navigation"
              >
                <a
                  aria-current={route && !route.standalone ? 'location' : undefined}
                  className="inline-flex min-h-10 items-center rounded-sm border-b border-transparent px-1 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=location]:border-primary/60 aria-[current=location]:text-foreground"
                  href={withBase(config.base, documentationHome.path)}
                >
                  {labels.documentation}
                </a>
              </nav>
            )}
          </div>
          <SearchDialog config={config} labels={labels} />
          {config.githubUrl && (
            <a
              aria-label="GitHub"
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 min-[23rem]:inline-flex sm:h-9 sm:w-9"
              href={config.githubUrl}
              rel="noreferrer"
              target="_blank"
            >
              <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.3c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.7.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
              </svg>
            </a>
          )}
          <LocaleSwitcher config={config} label={labels.language} route={route} routes={routes} />
          <ThemeToggle label={labels.theme} />
        </div>
      </header>
      {route?.standalone && Content ? (
        <>
          <main data-pagefind-body data-slot="standalone-page" id="main-content" tabIndex={-1}>
            <DoctrineLocaleContext value={locale}>
              <Content components={mdxComponents} />
            </DoctrineLocaleContext>
          </main>
          {renderFooter()}
        </>
      ) : (
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 px-4 lg:grid-cols-[var(--doctrine-sidebar-width)_minmax(0,1fr)] lg:px-8 xl:grid-cols-[var(--doctrine-sidebar-width)_minmax(0,1fr)_14rem]">
          <aside
            className="sticky top-[var(--doctrine-header-height)] hidden h-[calc(100vh-var(--doctrine-header-height))] overflow-y-auto border-r border-border/50 lg:block"
            data-pagefind-ignore
            data-slot="sidebar"
          >
            <Navigation
              current={route}
              icons={icons}
              items={navigation}
              label={labels.documentation}
              routes={localeRoutes}
            />
          </aside>
          <div className="min-w-0">
            <main
              className="px-0 py-10 sm:px-6 lg:px-12 lg:py-16"
              data-slot="main"
              id="main-content"
              tabIndex={-1}
            >
              {route && Content && (
                <TableOfContents label={labels.onThisPage} mobile routePath={route.path} />
              )}
              {route && Content ? (
                <>
                  <article
                    className="doctrine-prose mx-auto max-w-[var(--doctrine-content-width)]"
                    data-pagefind-body
                    data-slot="content"
                  >
                    <DoctrineLocaleContext value={locale}>
                      <Content components={mdxComponents} />
                    </DoctrineLocaleContext>
                  </article>
                  {renderPageNavigation()}
                </>
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
            {renderFooter()}
          </div>
          {route && Content && <TableOfContents label={labels.onThisPage} routePath={route.path} />}
        </div>
      )}
    </BaseContext>
  )
}
