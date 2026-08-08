import type { HTMLAttributes, ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { DoctrineLocaleContext } from './context.js'

interface ICodeBlockMetadata {
  filename?: string
  language?: string
}

export interface ICodeBlockPreProps extends HTMLAttributes<HTMLPreElement> {
  'data-filename'?: string
  'data-language'?: string
  'data-meta'?: string
}

const CODE_LANGUAGES: Readonly<Record<string, string>> = {
  bash: 'Bash',
  css: 'CSS',
  html: 'HTML',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  md: 'Markdown',
  mdx: 'MDX',
  sh: 'Shell',
  ts: 'TypeScript',
  tsx: 'TSX',
  txt: 'Text',
  yaml: 'YAML',
  yml: 'YAML',
}

const CodeBlockContext = createContext<ICodeBlockMetadata | undefined>(undefined)

export interface ICodeBlockProps {
  children: ReactNode
  filename?: string
  language?: string
}

export function CodeBlock({ children, filename, language }: ICodeBlockProps) {
  const metadata = useMemo(() => ({ filename, language }), [filename, language])
  return <CodeBlockContext value={metadata}>{children}</CodeBlockContext>
}

export function CodeBlockPre({
  children,
  className,
  'data-filename': dataFilename,
  'data-language': dataLanguage,
  'data-meta': dataMeta,
  ...props
}: ICodeBlockPreProps) {
  function filenameFromMeta(meta: string | undefined): string | undefined {
    const match = meta?.match(/(?:^|\s)(?:file|filename|title)=(?:"([^"]+)"|'([^']+)'|([^\s]+))/)
    return match?.[1] ?? match?.[2] ?? match?.[3]
  }

  function languageFromClassName(value: string | undefined): string | undefined {
    return value?.match(/(?:^|\s)language-([^\s]+)/)?.[1]
  }

  function textFromNode(node: ReactNode): string {
    return Children.toArray(node)
      .map((child) => {
        if (typeof child === 'string' || typeof child === 'number') return String(child)
        if (isValidElement<{ children?: ReactNode }>(child))
          return textFromNode(child.props.children)
        return ''
      })
      .join('')
  }

  const context = useContext(CodeBlockContext)
  const locale = useContext(DoctrineLocaleContext)
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<number | undefined>(undefined)
  const language = context?.language ?? dataLanguage ?? languageFromClassName(className) ?? 'text'
  const filename = context?.filename ?? dataFilename ?? filenameFromMeta(dataMeta)
  const code = textFromNode(children).replace(/\n$/, '')
  const copyLabel = locale.toLowerCase().startsWith('zh') ? '复制代码' : 'Copy code'
  const copiedLabel = locale.toLowerCase().startsWith('zh') ? '已复制' : 'Copied'

  useEffect(() => {
    return () => {
      if (resetTimer.current !== undefined) window.clearTimeout(resetTimer.current)
    }
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      return
    }
    setCopied(true)
    if (resetTimer.current !== undefined) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopied(false), 2_000)
  }

  return (
    <figure
      className="overflow-hidden rounded-lg border border-border bg-card"
      data-slot="code-block"
    >
      <figcaption
        className="flex min-h-10 items-center gap-2 border-b border-border bg-muted/50 px-3 text-xs text-muted-foreground"
        data-slot="code-block-header"
      >
        {filename && (
          <span
            className="min-w-0 flex-1 truncate font-mono text-foreground"
            data-slot="code-block-filename"
            title={filename}
          >
            {filename}
          </span>
        )}
        <span
          className={filename ? 'shrink-0' : 'min-w-0 flex-1 truncate'}
          data-slot="code-block-language"
        >
          {CODE_LANGUAGES[language.toLowerCase()] ?? language}
        </span>
        <button
          aria-label={copied ? copiedLabel : copyLabel}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:min-h-9 sm:min-w-0"
          data-slot="code-block-copy"
          onClick={handleCopy}
          title={copied ? copiedLabel : copyLabel}
          type="button"
        >
          {copied ? (
            <Check aria-hidden="true" className="size-3.5" />
          ) : (
            <Copy aria-hidden="true" className="size-3.5" />
          )}
          <span className="hidden sm:inline">{copied ? copiedLabel : copyLabel}</span>
        </button>
      </figcaption>
      <pre className={className} {...props}>
        {children}
      </pre>
    </figure>
  )
}
