import type { ReactNode } from 'react'

import * as BaseButton from '@base-ui/react/button'

export interface IButtonProps extends BaseButton.Button.Props {
  children?: ReactNode
  variant?: 'ghost' | 'outline'
}

const VARIANTS = {
  ghost: 'border-transparent bg-transparent hover:bg-muted hover:text-foreground',
  outline: 'border-border/70 bg-transparent hover:bg-muted hover:text-foreground',
} as const

export function Button({ className, variant = 'ghost', ...props }: IButtonProps) {
  return (
    <BaseButton.Button
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className ?? ''}`}
      {...props}
    />
  )
}
