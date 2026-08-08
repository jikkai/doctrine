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
      ? 'inline-flex max-w-full items-center gap-1 overflow-x-auto border-b border-border bg-transparent text-muted-foreground'
      : 'inline-flex min-h-13 w-fit max-w-full items-center justify-center overflow-x-auto rounded-lg bg-muted p-[3px] text-muted-foreground sm:h-9 sm:min-h-0'
  const tabClass =
    variant === 'line'
      ? 'relative inline-flex min-h-11 items-center justify-center whitespace-nowrap border-b-2 border-transparent px-3 py-1 text-sm font-medium transition-[color,box-shadow] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[active]:border-foreground data-[active]:text-foreground sm:min-h-9'
      : 'inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-3 py-1 text-sm font-medium transition-[color,box-shadow] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm sm:h-[calc(100%-1px)] sm:min-h-0 sm:px-2'

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
          className="flex-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
