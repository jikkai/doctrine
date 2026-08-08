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
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <Dialog.Viewport
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto sm:items-center"
        data-slot="dialog-viewport"
      >
        <Dialog.Popup
          className={`max-h-[calc(100dvh-1rem)] w-full rounded-lg border border-border bg-background text-foreground shadow-lg outline-none transition-all duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 sm:max-h-[calc(100dvh-2rem)] ${className ?? ''}`}
          initialFocus={initialFocus}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  )
}
