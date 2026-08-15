import type { HTMLAttributes } from 'react'

export interface IBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: IBadgeProps) {
  const variantClass =
    variant === 'outline'
      ? 'border-border/80 bg-transparent text-foreground'
      : 'border-transparent bg-accent/75 text-accent-foreground'
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold tracking-[0.01em] ${variantClass} ${className ?? ''}`}
      {...props}
      data-slot="badge"
    />
  )
}
