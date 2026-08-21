import type { HTMLAttributes, ReactNode } from 'react'
import { ChevronDownIcon, CodeXmlIcon } from 'lucide-react'
import { useContext } from 'react'

import { CodeBlock, CodeBlockPre } from './code-block.js'
import { DoctrineLocaleContext } from './context.js'

export interface ILivePreviewProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  children: ReactNode
  language?: string
  source?: string
  title?: ReactNode
}

export function LivePreview({
  children,
  className,
  language = 'tsx',
  source,
  title,
  ...props
}: ILivePreviewProps) {
  const locale = useContext(DoctrineLocaleContext)
  const chinese = locale.toLowerCase().startsWith('zh')
  const sourceLabel = chinese ? '源码' : 'Source'

  return (
    <section
      className={`my-6 overflow-hidden rounded-lg border border-separator bg-card shadow-sm ${className ?? ''}`}
      {...props}
      data-slot="live-preview"
    >
      {title && (
        <div
          className="flex h-9 items-center border-b border-separator bg-muted/50 px-4 text-sm font-medium text-foreground"
          data-slot="live-preview-title"
        >
          {title}
        </div>
      )}
      <div
        className="grid min-h-40 place-items-center overflow-auto p-6 sm:p-10"
        data-slot="live-preview-canvas"
      >
        {children}
      </div>
      {source && (
        <details className="group border-t border-separator" data-slot="live-preview-code">
          <summary
            className="flex h-9 cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
            data-slot="live-preview-code-toggle"
          >
            <CodeXmlIcon aria-hidden="true" className="size-3.5 shrink-0" />
            <span>{sourceLabel}</span>
            <ChevronDownIcon
              aria-hidden="true"
              className="ml-auto size-3.5 shrink-0 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <div
            className="border-t border-separator [&>figure]:my-0 [&>figure]:rounded-none [&>figure]:border-0 [&>figure]:shadow-none"
            data-slot="live-preview-source"
          >
            <CodeBlock language={language}>
              <CodeBlockPre>
                <code>{source}</code>
              </CodeBlockPre>
            </CodeBlock>
          </div>
        </details>
      )}
    </section>
  )
}
