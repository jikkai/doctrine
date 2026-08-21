import type { ReactNode } from 'react'

import * as BaseButton from '@base-ui/react/button'

export interface IButtonProps extends BaseButton.Button.Props {
  children?: ReactNode
  variant?: 'ghost' | 'outline'
}

const VARIANTS = {
  ghost:
    'border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  outline:
    'border-separator bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground',
} as const

export function Button({ className, variant = 'ghost', ...props }: IButtonProps) {
  return (
    <BaseButton.Button
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className ?? ''}`}
      {...props}
    />
  )
}
