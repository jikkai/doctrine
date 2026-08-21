import type { HTMLAttributes } from 'react'

export interface IBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: IBadgeProps) {
  const variantClass =
    variant === 'outline'
      ? 'border-separator bg-background text-foreground'
      : 'border-transparent bg-secondary text-secondary-foreground'
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded-md border px-2 text-xs font-medium ${variantClass} ${className ?? ''}`}
      {...props}
      data-slot="badge"
    />
  )
}
