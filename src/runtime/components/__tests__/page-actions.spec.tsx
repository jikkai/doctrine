import type { AnchorHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from 'react'
import assert from 'node:assert/strict'

import { renderToStaticMarkup } from 'react-dom/server'
import { test, vi } from 'vitest'

import { PageActions } from '../page-actions.js'

interface IChildrenProps {
  children?: ReactNode
}

interface ITriggerProps extends IChildrenProps {
  render: ReactElement
}

interface ILinkItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  closeOnClick?: boolean
}

vi.mock('@base-ui/react/menu', async () => {
  const { cloneElement, createElement } = await import('react')
  return {
    Menu: {
      LinkItem: ({ closeOnClick, ...props }: ILinkItemProps) => {
        if (closeOnClick !== true) throw new Error('Menu links must close the menu')
        return createElement('a', props)
      },
      Popup: (props: HTMLAttributes<HTMLDivElement>) => createElement('div', props),
      Portal: ({ children }: IChildrenProps) => children,
      Positioner: ({ children }: IChildrenProps) => children,
      Root: ({ children }: IChildrenProps) => children,
      Trigger: ({ children, render }: ITriggerProps) => cloneElement(render, undefined, children),
    },
  }
})

const LABELS = {
  copied: 'Copied',
  copyFailed: 'Copy failed',
  copyPage: 'Copy page',
  moreActions: 'More page actions',
  openInGitHub: 'Open in GitHub',
  viewAsMarkdown: 'View as Markdown',
}

test('renders copy and external page actions with accessible labels', () => {
  const html = renderToStaticMarkup(
    <PageActions
      labels={LABELS}
      markdownUrl="/guides/getting-started.md"
      sourceUrl="https://github.com/amamo/doctrine/blob/main/docs/getting-started.mdx"
    />,
  )

  assert.match(html, /data-slot="page-actions-copy"[^>]*>[\s\S]*Copy page/)
  assert.match(html, /aria-label="More page actions"[^>]*data-slot="page-actions-menu-trigger"/)
  assert.match(
    html,
    /data-slot="page-actions-markdown"[^>]*href="\/guides\/getting-started\.md"[^>]*target="_blank"[\s\S]*View as Markdown/,
  )
  assert.match(
    html,
    /data-slot="page-actions-source"[^>]*href="https:\/\/github\.com\/amamo\/doctrine\/blob\/main\/docs\/getting-started\.mdx"[^>]*target="_blank"[\s\S]*Open in GitHub/,
  )
})

test('omits the GitHub action when the page has no source URL', () => {
  const html = renderToStaticMarkup(
    <PageActions labels={LABELS} markdownUrl="/guides/generated.md" />,
  )

  assert.match(html, /data-slot="page-actions-markdown"/)
  assert.doesNotMatch(html, /data-slot="page-actions-source"/)
  assert.doesNotMatch(html, /Open in GitHub/)
})
