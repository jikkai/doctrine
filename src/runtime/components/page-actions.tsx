import { Menu } from '@base-ui/react/menu'
import { CheckIcon, ChevronDownIcon, CopyIcon, FileTextIcon, TriangleAlertIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { GitHubIcon } from './github-icon.js'
import { Button } from './ui/button.js'

export interface IPageActionsLabels {
  copied: string
  copyFailed: string
  copyPage: string
  moreActions: string
  openInGitHub: string
  viewAsMarkdown: string
}

export interface IPageActionsProps {
  labels: IPageActionsLabels
  markdownUrl: string
  sourceUrl?: string
}

type CopyStatus = 'copied' | 'copying' | 'failed' | 'idle'

const MENU_ITEM_CLASS =
  'flex min-h-8 cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm whitespace-nowrap text-popover-foreground outline-none select-none focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground'

export function PageActions({ labels, markdownUrl, sourceUrl }: IPageActionsProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (resetTimer.current !== undefined) window.clearTimeout(resetTimer.current)
    }
  }, [])

  function showCopyResult(status: Extract<CopyStatus, 'copied' | 'failed'>) {
    setCopyStatus(status)
    if (resetTimer.current !== undefined) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = undefined
      setCopyStatus('idle')
    }, 2_000)
  }

  async function handleCopy() {
    if (resetTimer.current !== undefined) {
      window.clearTimeout(resetTimer.current)
      resetTimer.current = undefined
    }
    setCopyStatus('copying')
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API is unavailable')
      const markdown = fetch(markdownUrl).then(async (response) => {
        if (!response.ok) throw new Error(`Unable to fetch Markdown: ${response.status}`)
        return response.text()
      })

      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': markdown.then((text) => new Blob([text], { type: 'text/plain' })),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(await markdown)
      }
      showCopyResult('copied')
    } catch {
      showCopyResult('failed')
    }
  }

  const copyLabel =
    copyStatus === 'copied'
      ? labels.copied
      : copyStatus === 'failed'
        ? labels.copyFailed
        : labels.copyPage

  return (
    <div
      className="inline-flex h-8 items-stretch rounded-[var(--radius)] bg-secondary text-secondary-foreground"
      data-slot="page-actions"
    >
      <Button
        aria-busy={copyStatus === 'copying'}
        className="h-8! rounded-l-[var(--radius)]! rounded-r-none! border-0! bg-transparent! px-2.5 text-secondary-foreground! hover:bg-accent!"
        data-slot="page-actions-copy"
        disabled={copyStatus === 'copying'}
        onClick={handleCopy}
        type="button"
        variant="ghost"
      >
        {copyStatus === 'copied' ? (
          <CheckIcon aria-hidden="true" className="size-3.5" />
        ) : copyStatus === 'failed' ? (
          <TriangleAlertIcon aria-hidden="true" className="size-3.5" />
        ) : (
          <CopyIcon aria-hidden="true" className="size-3.5" />
        )}
        <span aria-live="polite">{copyLabel}</span>
      </Button>

      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              aria-label={labels.moreActions}
              className="relative h-8! w-8 rounded-l-none! rounded-r-[var(--radius)]! border-0! bg-transparent! px-0! text-secondary-foreground! before:absolute before:inset-y-1.5 before:left-0 before:w-px before:bg-separator hover:bg-accent!"
              data-slot="page-actions-menu-trigger"
              title={labels.moreActions}
              type="button"
              variant="ghost"
            />
          }
        >
          <ChevronDownIcon aria-hidden="true" className="size-3.5" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" className="z-50 outline-none" sideOffset={4}>
            <Menu.Popup
              className="min-w-52 origin-[var(--transform-origin)] rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none transition-[scale,opacity] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
              data-slot="page-actions-menu"
            >
              <Menu.LinkItem
                className={MENU_ITEM_CLASS}
                closeOnClick
                data-slot="page-actions-markdown"
                href={markdownUrl}
                rel="noreferrer"
                target="_blank"
              >
                <FileTextIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                {labels.viewAsMarkdown}
              </Menu.LinkItem>
              {sourceUrl && (
                <Menu.LinkItem
                  className={MENU_ITEM_CLASS}
                  closeOnClick
                  data-slot="page-actions-source"
                  href={sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <GitHubIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  {labels.openInGitHub}
                </Menu.LinkItem>
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  )
}
