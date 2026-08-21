import type { HTMLAttributes } from 'react'

export interface IStepProps extends HTMLAttributes<HTMLLIElement> {
  title?: string
}

export function Step({ children, className, title, ...props }: IStepProps) {
  return (
    <li className={`relative pb-7 pl-7 last:pb-0 ${className ?? ''}`} {...props} data-slot="step">
      <span
        aria-hidden="true"
        className="absolute top-0 -left-3.5 flex size-7 items-center justify-center rounded-full border border-input bg-background text-xs font-semibold text-foreground shadow-sm before:content-[counter(list-item)]"
      />
      {title && <h3 className="mt-0 text-base font-semibold text-foreground">{title}</h3>}
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">{children}</div>
    </li>
  )
}

export interface IStepsProps extends HTMLAttributes<HTMLOListElement> {}

export function Steps({ className, ...props }: IStepsProps) {
  return (
    <ol
      className={`ml-4 list-none border-l border-separator pl-0 ${className ?? ''}`}
      {...props}
      data-slot="steps"
    />
  )
}
