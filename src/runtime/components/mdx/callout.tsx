import type { HTMLAttributes } from 'react'
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, XCircleIcon } from 'lucide-react'

export interface ICalloutProps extends HTMLAttributes<HTMLElement> {
  title?: string
  variant?: 'danger' | 'note' | 'tip' | 'warning'
}

const CALLOUT_VARIANTS = {
  danger: {
    className: 'border-red-600/70 text-red-950 dark:border-red-400/70 dark:text-red-100',
    icon: XCircleIcon,
  },
  note: {
    className: 'border-primary/70 text-card-foreground',
    icon: InfoIcon,
  },
  tip: {
    className:
      'border-emerald-600/70 text-emerald-950 dark:border-emerald-400/70 dark:text-emerald-100',
    icon: CircleCheckIcon,
  },
  warning: {
    className: 'border-amber-600/70 text-amber-950 dark:border-amber-400/70 dark:text-amber-100',
    icon: TriangleAlertIcon,
  },
} as const

export function Callout({ children, className, title, variant = 'note', ...props }: ICalloutProps) {
  const definition = CALLOUT_VARIANTS[variant]
  const Icon = definition.icon
  return (
    <aside
      className={`flex gap-3 border-l-2 px-4 py-1 text-sm ${definition.className} ${className ?? ''}`}
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
