import type { HTMLAttributes } from 'react'

export interface ICardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function Card({ children, className, title, ...props }: ICardProps) {
  return (
    <div
      className={`rounded-lg border border-border/70 bg-card/45 p-5 text-card-foreground ${className ?? ''}`}
      {...props}
      data-slot="card"
    >
      {title && <h3 className="mt-0 text-base">{title}</h3>}
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">{children}</div>
    </div>
  )
}

export interface ICardGridProps extends HTMLAttributes<HTMLDivElement> {}

export function CardGrid({ className, ...props }: ICardGridProps) {
  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 ${className ?? ''}`}
      {...props}
      data-slot="card-grid"
    />
  )
}
