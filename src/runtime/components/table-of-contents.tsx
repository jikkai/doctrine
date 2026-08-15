import { ChevronDownIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface ITableOfContentsItem {
  id: string
  level: 2 | 3
  title: string
}

export interface ITableOfContentsProps {
  label: string
  mobile?: boolean
  routePath: string
}

export function TableOfContents({ label, mobile, routePath }: ITableOfContentsProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [activeId, setActiveId] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [items, setItems] = useState<ITableOfContentsItem[]>([])

  useEffect(() => {
    const content = document.querySelector<HTMLElement>('[data-slot="content"]')
    if (!content) {
      setHydrated(true)
      return
    }
    const contentElement = content

    let sectionObserver: IntersectionObserver | undefined

    function slug(value: string): string {
      return (
        value
          .normalize('NFKD')
          .toLowerCase()
          .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
          .trim()
          .replace(/[\s-]+/g, '-') || 'section'
      )
    }

    function update() {
      const headings = Array.from(
        contentElement.querySelectorAll<HTMLHeadingElement>(':scope > h2, :scope > h3'),
      )
      const counts = new Map<string, number>()
      const nextItems = headings.map((heading) => {
        const title = heading.textContent?.trim() ?? ''
        const base = slug(heading.id || title)
        const count = (counts.get(base) ?? 0) + 1
        counts.set(base, count)
        const id = count === 1 ? base : `${base}-${count}`
        heading.id = id
        return {
          id,
          level: heading.tagName === 'H2' ? 2 : 3,
          title,
        } satisfies ITableOfContentsItem
      })

      setItems(nextItems)
      setHydrated(true)
      setActiveId((current) =>
        nextItems.some((item) => item.id === current) ? current : (nextItems[0]?.id ?? ''),
      )

      sectionObserver?.disconnect()
      sectionObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .toSorted((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          const id = visible[0]?.target.id
          if (id) setActiveId(id)
        },
        { rootMargin: '-80px 0px -70% 0px' },
      )
      for (const heading of headings) sectionObserver.observe(heading)
    }

    update()
    const contentObserver = new MutationObserver(update)
    contentObserver.observe(contentElement, { childList: true, subtree: true })
    return () => {
      contentObserver.disconnect()
      sectionObserver?.disconnect()
    }
  }, [routePath])

  function handleNavigate(id: string) {
    setActiveId(id)
    if (mobile) detailsRef.current?.removeAttribute('open')
  }

  function renderItems() {
    return (
      <ul className="space-y-0.5 border-l border-border/60">
        {items.map((item) => (
          <li key={item.id}>
            <a
              aria-current={activeId === item.id ? 'location' : undefined}
              className={`relative block min-h-7 py-1 pr-1 pl-3 text-[0.78125rem] leading-5 text-muted-foreground transition-colors before:absolute before:inset-y-1.5 before:-left-px before:w-px before:bg-transparent hover:text-foreground aria-[current=location]:font-medium aria-[current=location]:text-foreground aria-[current=location]:before:bg-primary ${item.level === 3 ? 'pl-6' : ''}`}
              href={`#${item.id}`}
              onClick={() => handleNavigate(item.id)}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    )
  }

  if (hydrated && items.length === 0) return null

  if (mobile) {
    return (
      <details
        className="group mx-auto mb-10 max-w-[var(--doctrine-content-width)] border-y border-border/60 xl:hidden"
        data-pagefind-ignore
        data-slot="toc-mobile"
        ref={detailsRef}
      >
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">{label}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </summary>
        <nav aria-label={label} className="pb-4 pt-1">
          {renderItems()}
        </nav>
      </details>
    )
  }

  return (
    <aside
      className="sticky top-[var(--doctrine-header-height)] hidden h-[calc(100vh-var(--doctrine-header-height))] overflow-y-auto py-9 pl-6 xl:block"
      data-pagefind-ignore
      data-slot="toc"
    >
      <p className="mb-4 text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </p>
      <nav aria-label={label}>{renderItems()}</nav>
    </aside>
  )
}
