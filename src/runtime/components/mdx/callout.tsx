import type { HTMLAttributes } from 'react'
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, XCircleIcon } from 'lucide-react'

export interface ICalloutProps extends HTMLAttributes<HTMLElement> {
  title?: string
  variant?: 'danger' | 'note' | 'tip' | 'warning'
}

const CALLOUT_VARIANTS = {
  danger: {
    className: 'border-red-500/40 bg-red-500/10 text-red-950 dark:text-red-100',
    icon: XCircleIcon,
  },
  note: {
    className: 'border-border bg-card text-card-foreground',
    icon: InfoIcon,
  },
  tip: {
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100',
    icon: CircleCheckIcon,
  },
  warning: {
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    icon: TriangleAlertIcon,
  },
} as const

export function Callout({ children, className, title, variant = 'note', ...props }: ICalloutProps) {
  const definition = CALLOUT_VARIANTS[variant]
  const Icon = definition.icon
  return (
    <aside
      className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${definition.className} ${className ?? ''}`}
      {...props}
      data-slot="callout"
      data-variant={variant}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="mt-0 font-semibold">{title}</p>}
        <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">{children}</div>
      </div>
    </aside>
  )
}
