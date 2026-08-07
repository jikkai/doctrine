import type { HTMLAttributes, ReactNode } from 'react'
import * as TabsPrimitive from '@base-ui/react/tabs'
import { CircleCheck, Info, TriangleAlert, XCircle } from 'lucide-react'
import { Children, isValidElement } from 'react'

import type { IDoctrineComponents } from '../../config.js'

export interface IBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: IBadgeProps) {
  const variantClass =
    variant === 'outline'
      ? 'border-border bg-transparent text-foreground'
      : 'border-transparent bg-accent text-accent-foreground'
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variantClass} ${className ?? ''}`}
      {...props}
      data-slot="badge"
    />
  )
}

export interface ICalloutProps extends HTMLAttributes<HTMLElement> {
  title?: string
  variant?: 'danger' | 'note' | 'tip' | 'warning'
}

const CALLOUT_VARIANTS = {
  danger: {
    className: 'border-red-500/40 bg-red-500/10 text-red-950 dark:text-red-100',
    icon: XCircle,
  },
  note: {
    className: 'border-border bg-muted text-foreground',
    icon: Info,
  },
  tip: {
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100',
    icon: CircleCheck,
  },
  warning: {
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    icon: TriangleAlert,
  },
} as const

export function Callout({ children, className, title, variant = 'note', ...props }: ICalloutProps) {
  const definition = CALLOUT_VARIANTS[variant]
  const Icon = definition.icon
  return (
    <aside
      className={`my-6 flex gap-3 rounded-lg border px-4 py-3 text-sm ${definition.className} ${className ?? ''}`}
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

export interface ICardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function Card({ children, className, title, ...props }: ICardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-background p-5 ${className ?? ''}`}
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
      className={`my-6 grid gap-4 sm:grid-cols-2 ${className ?? ''}`}
      {...props}
      data-slot="card-grid"
    />
  )
}

export interface IStepProps extends HTMLAttributes<HTMLLIElement> {
  title?: string
}

export function Step({ children, className, title, ...props }: IStepProps) {
  return (
    <li className={`relative pb-6 pl-10 last:pb-0 ${className ?? ''}`} {...props} data-slot="step">
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground before:content-[counter(list-item)]"
      />
      {title && <h3 className="mt-0 text-base">{title}</h3>}
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">{children}</div>
    </li>
  )
}

export interface IStepsProps extends HTMLAttributes<HTMLOListElement> {}

export function Steps({ className, ...props }: IStepsProps) {
  return (
    <ol
      className={`my-6 ml-3 list-none border-l border-border pl-0 ${className ?? ''}`}
      {...props}
      data-slot="steps"
    />
  )
}

export interface ITabProps {
  children: ReactNode
  label: ReactNode
  value?: string
}

export function Tab({ children }: ITabProps) {
  return children
}

export interface ITabsProps {
  children: ReactNode
  className?: string
  defaultValue?: string
}

export function Tabs({ children, className, defaultValue }: ITabsProps) {
  const items = Children.toArray(children).filter(isValidElement<ITabProps>)
  const values = items.map((item, index) => item.props.value ?? String(index))
  if (items.length === 0) return null

  return (
    <TabsPrimitive.Tabs.Root
      className={`my-6 ${className ?? ''}`}
      data-slot="tabs"
      defaultValue={defaultValue ?? values[0]}
    >
      <TabsPrimitive.Tabs.List
        className="flex gap-1 overflow-x-auto border-b border-border"
        data-slot="tab-list"
      >
        {items.map((item, index) => (
          <TabsPrimitive.Tabs.Tab
            className="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground data-[active]:border-accent data-[active]:text-foreground"
            data-slot="tab"
            key={values[index]}
            value={values[index]}
          >
            {item.props.label}
          </TabsPrimitive.Tabs.Tab>
        ))}
      </TabsPrimitive.Tabs.List>
      {items.map((item, index) => (
        <TabsPrimitive.Tabs.Panel
          className="rounded-b-lg border border-t-0 border-border p-4"
          data-slot="tab-panel"
          key={values[index]}
          value={values[index]}
        >
          {item.props.children}
        </TabsPrimitive.Tabs.Panel>
      ))}
    </TabsPrimitive.Tabs.Root>
  )
}

export const builtinMdxComponents = {
  Badge,
  Callout,
  Card,
  CardGrid,
  Step,
  Steps,
  Tab,
  Tabs,
} satisfies IDoctrineComponents
