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
      className={`overflow-hidden rounded-lg border border-border/70 bg-card/35 ${className ?? ''}`}
      {...props}
      data-slot="live-preview"
    >
      {title && (
        <div
          className="border-b border-border/60 bg-muted/25 px-4 py-3 text-sm font-medium text-foreground"
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
        <details className="group border-t border-border/60" data-slot="live-preview-code">
          <summary
            className="flex min-h-10 cursor-pointer list-none items-center gap-2 px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden"
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
            className="border-t border-border/60 [&>figure]:rounded-none [&>figure]:border-0"
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
