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
  language: string
  menu: string
  noResults: string
  notFound: string
  notFoundDescription: string
  onThisPage: string
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
    onThisPage: 'On This Page',
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
    onThisPage: '本页目录',
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
  icons,
  items,
  mobile,
  routes,
}: {
  current?: IDocumentRoute
  icons: DoctrineIcons
  items: readonly DoctrineNavigationNode[]
  mobile?: boolean
  routes: readonly IDocumentRoute[]
}) {
  const base = useContext(BaseContext)

  function renderItems(nodes: readonly DoctrineNavigationNode[], nested = false): ReactNode {
    return (
      <ul className={nested ? 'mt-1 space-y-1 border-l border-border pl-3' : 'space-y-1'}>
        {nodes.map((item) => {
          const Icon = item.icon ? icons[item.icon] : undefined
          if (item.type === 'directory') {
            return (
              <li className="pt-3 first:pt-0" key={item.directory}>
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
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
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-accent-foreground ${mobile ? 'min-h-11' : ''}`}
                href={withBase(base, route.path)}
              >
                {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
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
      aria-label="Documentation"
      className={mobile ? 'max-h-[calc(100dvh-4.5rem)] overflow-y-auto p-4' : 'py-6 pr-5'}
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
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9 sm:w-9 lg:hidden!"
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
        <Navigation current={current} icons={icons} items={items} mobile routes={routes} />
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
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9 sm:w-9"
        data-slot="locale-switcher"
      >
        <LanguagesIcon aria-hidden="true" className="size-4" />
        <Select.Value className="sr-only" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner align="end" className="z-50 outline-none" sideOffset={4}>
          <Select.Popup className="min-w-36 rounded-md border border-border bg-background p-1 text-foreground shadow-md outline-none">
            <Select.List>
              {items.map((item) => (
                <Select.Item
                  className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
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
      className="h-11 w-11 shrink-0 px-0! sm:h-9 sm:w-9"
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
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-input bg-background text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9 sm:w-52 sm:justify-start sm:px-3"
      >
        <SearchIcon aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">{labels.search}</span>
        <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Dialog.Trigger>
      <DialogSurface className="max-w-2xl overflow-hidden" initialFocus={inputRef}>
        <Dialog.Title className="sr-only">{labels.search}</Dialog.Title>
        <Dialog.Description className="sr-only">{labels.searchPlaceholder}</Dialog.Description>
        <div className="flex items-center border-b border-border px-4">
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
        <div aria-live="polite" className="max-h-[min(55dvh,28rem)] min-h-24 overflow-y-auto p-2">
          {status === 'loading' && <p className="p-4 text-sm text-muted-foreground">…</p>}
          {status === 'ready' && results.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">{labels.noResults}</p>
          )}
          {results.map((result) => (
            <a
              className="block rounded-lg p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
              href={result.url}
              key={result.url}
            >
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

export function App({ Content, components, config, icons, route, routes }: IAppProps) {
  const locale = route?.locale ?? config.locales.default
  const labels = labelsFor(locale)
  const localeRoutes = routes.filter((candidate) => candidate.locale === locale)
  const navigation = config.navigation[locale] ?? []
  const home = localeRoutes.find((candidate) => candidate.slug === '/') ?? localeRoutes[0]
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
        className="mx-auto max-w-[var(--doctrine-content-width)] border-t border-border py-8 text-center text-sm text-muted-foreground"
        data-pagefind-ignore
        data-slot="footer"
      >
        {config.copyright}
      </footer>
    )
  }

  return (
    <BaseContext value={config.base}>
      <header
        className="sticky top-0 z-40 h-[var(--doctrine-header-height)] bg-background/80 backdrop-blur-xl"
        data-pagefind-ignore
        data-slot="header"
      >
        <div
          className="relative mx-auto flex h-full max-w-screen-2xl items-center gap-2 px-3 after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-border/70 sm:gap-3 sm:px-4 sm:after:inset-x-4 lg:px-8 lg:after:inset-x-8"
          data-slot="header-inner"
        >
          <MobileNavigation
            current={route}
            icons={icons}
            items={navigation}
            labels={labels}
            routes={localeRoutes}
          />
          <a
            className="group relative mr-auto inline-flex min-h-11 min-w-0 shrink items-center truncate rounded-sm text-sm font-semibold tracking-tight after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-right after:scale-x-0 after:bg-current after:opacity-40 after:transition-transform after:duration-200 hover:after:origin-left hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:after:transition-none sm:min-h-9 sm:text-base"
            data-slot="brand"
            href={withBase(config.base, home?.path ?? '/')}
          >
            {siteTitle}
          </a>
          <SearchDialog config={config} labels={labels} />
          {config.githubUrl && (
            <a
              aria-label="GitHub"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9 sm:w-9"
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
          <main data-pagefind-body data-slot="standalone-page">
            <DoctrineLocaleContext value={locale}>
              <Content components={mdxComponents} />
            </DoctrineLocaleContext>
          </main>
          {renderFooter()}
        </>
      ) : (
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 px-4 lg:grid-cols-[var(--doctrine-sidebar-width)_minmax(0,1fr)] lg:px-8 xl:grid-cols-[var(--doctrine-sidebar-width)_minmax(0,1fr)_14rem]">
          <aside
            className="sticky top-[var(--doctrine-header-height)] hidden h-[calc(100vh-var(--doctrine-header-height))] overflow-y-auto border-r border-border lg:block"
            data-pagefind-ignore
            data-slot="sidebar"
          >
            <Navigation current={route} icons={icons} items={navigation} routes={localeRoutes} />
          </aside>
          <div className="min-w-0">
            <main className="px-0 py-10 sm:px-6 lg:px-12 lg:py-14" data-slot="main">
              {route && Content && (
                <TableOfContents label={labels.onThisPage} mobile routePath={route.path} />
              )}
              {route && Content ? (
                <article
                  className="doctrine-prose mx-auto max-w-[var(--doctrine-content-width)]"
                  data-pagefind-body
                  data-slot="content"
                >
                  <DoctrineLocaleContext value={locale}>
                    <Content components={mdxComponents} />
                  </DoctrineLocaleContext>
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
            {renderFooter()}
          </div>
          {route && Content && <TableOfContents label={labels.onThisPage} routePath={route.path} />}
        </div>
      )}
    </BaseContext>
  )
}
