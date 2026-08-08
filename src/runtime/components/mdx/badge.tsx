import type { HTMLAttributes } from 'react'

export interface IBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: IBadgeProps) {
  const variantClass =
    variant === 'outline'
      ? 'border-input bg-background text-foreground'
      : 'border-transparent bg-primary text-primary-foreground'
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variantClass} ${className ?? ''}`}
      {...props}
      data-slot="badge"
    />
  )
}
