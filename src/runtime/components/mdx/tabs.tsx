import type { ReactNode } from 'react'
import * as TabsPrimitive from '@base-ui/react/tabs'
import { Children, isValidElement } from 'react'

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
  variant?: 'default' | 'line'
}

export function Tabs({ children, className, defaultValue, variant = 'default' }: ITabsProps) {
  const items = Children.toArray(children).filter(isValidElement<ITabProps>)
  const values = items.map((item, index) => item.props.value ?? String(index))
  if (items.length === 0) return null

  const listClass =
    variant === 'line'
      ? 'inline-flex h-8 w-fit max-w-full items-center gap-1 self-start overflow-x-auto bg-transparent p-[3px] text-muted-foreground'
      : 'inline-flex h-8 max-w-full items-center self-start overflow-x-auto rounded-[var(--radius)] bg-muted p-[3px] text-muted-foreground'
  const tabClass =
    variant === 'line'
      ? 'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--radius)-0.125rem)] border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-medium text-foreground/60 transition-all after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-active:bg-transparent data-active:text-foreground data-active:shadow-none data-active:after:opacity-100 dark:text-muted-foreground dark:hover:text-foreground dark:data-active:border-transparent dark:data-active:bg-transparent'
      : 'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--radius)-0.125rem)] border border-transparent px-1.5 py-0.5 text-sm font-medium text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-active:bg-background data-active:text-foreground data-active:shadow-sm dark:text-muted-foreground dark:hover:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground'

  return (
    <TabsPrimitive.Tabs.Root
      className={`flex flex-col gap-2 ${className ?? ''}`}
      data-slot="tabs"
      data-variant={variant}
      defaultValue={defaultValue ?? values[0]}
    >
      <TabsPrimitive.Tabs.List className={listClass} data-slot="tab-list">
        {items.map((item, index) => (
          <TabsPrimitive.Tabs.Tab
            className={tabClass}
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
          className="flex-1 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>[data-slot='code-block']]:my-0"
          data-slot="tab-panel"
          keepMounted
          key={values[index]}
          value={values[index]}
        >
          {item.props.children}
        </TabsPrimitive.Tabs.Panel>
      ))}
    </TabsPrimitive.Tabs.Root>
  )
}
