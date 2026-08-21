import type { ChangeEvent, ComponentProps, ComponentType, ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Select } from '@base-ui/react/select'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  LanguagesIcon,
  MoonIcon,
  PanelLeftIcon,
  SearchIcon,
  SunIcon,
  XIcon,
} from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import type { IDoctrineComponents } from '../config.js'
import type { DoctrineNavigationNode } from '../navigation.js'
import type { IPageActionsLabels } from './components/page-actions.js'
import type { DoctrineIcons, IDocumentRoute, IMdxContentProps, IRuntimeConfig } from './types.js'

import { GitHubIcon } from './components/github-icon.js'
import { DoctrineLocaleContext } from './components/mdx/context.js'
import { builtinMdxComponents } from './components/mdx/registry.js'
import { PageActions } from './components/page-actions.js'
import { TableOfContents } from './components/table-of-contents.js'
import { Button } from './components/ui/button.js'
import { DialogSurface } from './components/ui/dialog-surface.js'
import { SheetSurface } from './components/ui/sheet-surface.js'
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
  pageActions: IPageActionsLabels
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
    pageActions: {
      copied: 'Copied',
      copyFailed: 'Copy failed',
      copyPage: 'Copy Page',
      moreActions: 'More page actions',
      openInGitHub: 'Open in GitHub',
      viewAsMarkdown: 'View as Markdown',
    },
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
    pageActions: {
      copied: '已复制',
      copyFailed: '复制失败',
      copyPage: '复制页面',
      moreActions: '更多页面操作',
      openInGitHub: '在 GitHub 中打开',
      viewAsMarkdown: '查看 Markdown',
    },
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
      <ul className={nested ? 'ml-3 border-l border-separator pl-2' : undefined}>
        {nodes.map((item) => {
          const Icon = item.icon ? icons[item.icon] : undefined
          if (item.type === 'directory') {
            return (
              <li className="mt-5" key={item.directory}>
                <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm font-semibold text-sidebar-foreground">
                  {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
                  <span className="min-w-0 wrap-break-word whitespace-normal">{item.title}</span>
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
                className={`my-0.5 flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-sm leading-5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground ${mobile ? 'min-h-11' : ''}`}
                href={withBase(base, route.path)}
              >
                {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
                <span className="min-w-0 flex-1 wrap-break-word whitespace-normal">
                  {item.title}
                </span>
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
      className={mobile ? 'min-h-0 flex-1 overflow-y-auto py-5 pr-3 pl-2' : 'py-5 pr-3 pl-2'}
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
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden!"
      >
        <PanelLeftIcon aria-hidden="true" className="size-4" />
      </Dialog.Trigger>
      <SheetSurface>
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-separator px-5">
          <Dialog.Title className="text-sm font-semibold text-foreground">
            {labels.menu}
          </Dialog.Title>
          <Dialog.Close
            aria-label={labels.close}
            className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
      </SheetSurface>
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
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        data-slot="locale-switcher"
      >
        <LanguagesIcon aria-hidden="true" className="size-4" />
        <Select.Value className="sr-only" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner align="end" className="z-50 outline-none" sideOffset={4}>
          <Select.Popup className="min-w-36 origin-[var(--transform-origin)] rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none transition-[scale,opacity] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Select.List>
              {items.map((item) => (
                <Select.Item
                  className="grid min-h-8 cursor-default grid-cols-[1rem_1fr] items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
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
      className="size-9 shrink-0 border-transparent! px-0! shadow-none!"
      onClick={handleClick}
      variant="ghost"
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
        className="inline-flex size-9 shrink-0 items-center justify-center gap-2 rounded-md bg-muted/70 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-48 sm:justify-start sm:px-2.5 lg:w-60"
      >
        <SearchIcon aria-hidden="true" className="size-4 shrink-0" />
        <span className="hidden flex-1 truncate text-left sm:block">{labels.search}</span>
      </Dialog.Trigger>
      <DialogSurface className="max-w-2xl overflow-hidden" initialFocus={inputRef}>
        <Dialog.Title className="sr-only">{labels.search}</Dialog.Title>
        <Dialog.Description className="sr-only">{labels.searchPlaceholder}</Dialog.Description>
        <div className="flex items-center gap-2.5 border-b border-separator px-4">
          <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          <input
            aria-label={labels.search}
            autoComplete="off"
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            onChange={handleQueryChange}
            placeholder={labels.searchPlaceholder}
            ref={inputRef}
            value={query}
          />
          <Dialog.Close
            aria-label={labels.close}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <XIcon aria-hidden="true" className="size-4" />
          </Dialog.Close>
        </div>
        <div
          aria-busy={status === 'loading'}
          aria-live="polite"
          className="max-h-[min(55dvh,32rem)] min-h-28 overflow-y-auto p-1.5"
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
              className="block rounded-md px-3 py-2 text-sm leading-5 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              href={result.url}
              key={result.url}
            >
              <strong className="block text-sm">{result.meta.title ?? result.url}</strong>
              <span
                className="mt-0.5 line-clamp-3 text-sm leading-5 text-muted-foreground [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-foreground"
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
        className="mx-auto max-w-[var(--doctrine-content-width)] border-t border-separator py-10 text-center text-xs text-muted-foreground"
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
        className="mx-auto mt-16 grid max-w-[var(--doctrine-content-width)] gap-3 border-t border-separator pt-8 sm:grid-cols-2"
        data-pagefind-ignore
        data-slot="page-navigation"
      >
        {previousRoute ? (
          <a
            className="group flex min-h-24 min-w-0 flex-col justify-center rounded-lg border border-separator bg-card px-5 py-4 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={withBase(config.base, previousRoute.path)}
          >
            <span className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <ArrowLeftIcon
                aria-hidden="true"
                className="size-3.5 transition-transform group-hover:-translate-x-0.5"
              />
              {labels.previous}
            </span>
            <strong className="block truncate font-medium text-foreground">
              {previousRoute.title}
            </strong>
          </a>
        ) : (
          <span className="hidden sm:block" />
        )}
        {nextRoute && (
          <a
            className="group flex min-h-24 min-w-0 flex-col items-end justify-center rounded-lg border border-separator bg-card px-5 py-4 text-right transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={withBase(config.base, nextRoute.path)}
          >
            <span className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              {labels.next}
              <ArrowRightIcon
                aria-hidden="true"
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
              />
            </span>
            <strong className="block truncate font-medium text-foreground">
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
        className="sticky top-0 z-40 h-[var(--doctrine-header-height)] border-b border-separator bg-background/90 backdrop-blur-xl"
        data-pagefind-ignore
        data-slot="header"
      >
        <div
          className="mx-auto flex h-full max-w-screen-2xl items-center gap-1.5 px-3 sm:px-4"
          data-slot="header-inner"
        >
          <MobileNavigation
            current={route}
            icons={icons}
            items={navigation}
            labels={labels}
            routes={localeRoutes}
          />
          <div className="min-w-0 shrink border-r border-separator pr-2.5 sm:shrink-0 sm:pr-4">
            <a
              className="inline-flex h-9 min-w-0 items-center truncate rounded-md text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              data-slot="brand"
              href={withBase(config.base, home?.path ?? '/')}
            >
              {siteTitle}
            </a>
          </div>
          {documentationHome && (
            <nav
              aria-label={labels.documentation}
              className="hidden shrink-0 items-center gap-1 lg:flex"
              data-slot="header-navigation"
            >
              <a
                aria-current={route && !route.standalone ? 'location' : undefined}
                className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring aria-[current=location]:bg-accent aria-[current=location]:font-medium aria-[current=location]:text-accent-foreground"
                href={withBase(config.base, documentationHome.path)}
              >
                {labels.documentation}
              </a>
            </nav>
          )}
          <div className="flex-1" />
          <SearchDialog config={config} labels={labels} />
          {config.githubUrl && (
            <a
              aria-label="GitHub"
              className="hidden size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline-flex"
              href={config.githubUrl}
              rel="noreferrer"
              target="_blank"
            >
              <GitHubIcon aria-hidden="true" className="size-4" />
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
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 md:grid-cols-[var(--doctrine-sidebar-width)_minmax(0,1fr)] xl:grid-cols-[var(--doctrine-sidebar-width)_minmax(0,1fr)_var(--doctrine-toc-width)]">
          <aside
            className="sticky top-[var(--doctrine-header-height)] hidden h-[calc(100svh-var(--doctrine-header-height))] overflow-y-auto border-r border-separator bg-sidebar md:block"
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
              className="px-4 py-10 sm:px-6 lg:py-12"
              data-slot="main"
              id="main-content"
              tabIndex={-1}
            >
              {route && Content ? (
                <>
                  <div className="mx-auto max-w-[var(--doctrine-content-width)] sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6 print:block">
                    {route.source && (
                      <div
                        className="mb-5 flex justify-end sm:col-start-2 sm:row-start-2 sm:z-10 sm:mt-0.5 sm:mb-0 sm:self-start"
                        data-pagefind-ignore
                        data-slot="page-actions-row"
                      >
                        <PageActions
                          labels={labels.pageActions}
                          markdownUrl={withBase(config.base, route.source.markdownPath)}
                          sourceUrl={route.source.githubUrl}
                        />
                      </div>
                    )}
                    <div className="sm:col-span-2 sm:row-start-1">
                      <TableOfContents label={labels.onThisPage} mobile routePath={route.path} />
                    </div>
                    <article
                      className={`doctrine-prose min-w-0 max-w-[var(--doctrine-content-width)] sm:col-span-2 sm:col-start-1 sm:row-start-2 ${route.source ? 'sm:[&>h1:first-child]:pr-44 print:[&>h1:first-child]:pr-0' : ''}`}
                      data-pagefind-body
                      data-slot="content"
                    >
                      <DoctrineLocaleContext value={locale}>
                        <Content components={mdxComponents} />
                      </DoctrineLocaleContext>
                    </article>
                  </div>
                  {renderPageNavigation()}
                </>
              ) : (
                <div className="mx-auto max-w-3xl py-20 text-center">
                  <p className="text-sm font-medium text-muted-foreground">404</p>
                  <h1 className="mt-3 text-[1.75rem] leading-9 font-semibold">{labels.notFound}</h1>
                  <p className="mt-4 text-muted-foreground">{labels.notFoundDescription}</p>
                  <a
                    className="mt-8 inline-block font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
