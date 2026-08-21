import type { ReactNode } from 'react'

import { Dialog } from '@base-ui/react/dialog'

export interface IDialogSurfaceProps {
  children: ReactNode
  className?: string
  initialFocus?: Dialog.Popup.Props['initialFocus']
}

export function DialogSurface({ children, className, initialFocus }: IDialogSurfaceProps) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none dark:bg-background/70" />
      <Dialog.Viewport
        className="fixed inset-0 z-50 grid place-items-start overflow-y-auto px-4 pt-20 sm:place-items-center sm:pt-4"
        data-slot="dialog-viewport"
      >
        <Dialog.Popup
          className={`max-h-[calc(100dvh-5rem)] w-full rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl shadow-foreground/10 outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none sm:max-h-[calc(100dvh-2rem)] ${className ?? ''}`}
          initialFocus={initialFocus}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  )
}
