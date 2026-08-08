import type { HTMLAttributes } from 'react'

export interface IStepProps extends HTMLAttributes<HTMLLIElement> {
  title?: string
}

export function Step({ children, className, title, ...props }: IStepProps) {
  return (
    <li className={`relative pb-6 pl-10 last:pb-0 ${className ?? ''}`} {...props} data-slot="step">
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground before:content-[counter(list-item)]"
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
      className={`ml-3 list-none border-l border-border pl-0 ${className ?? ''}`}
      {...props}
      data-slot="steps"
    />
  )
}
