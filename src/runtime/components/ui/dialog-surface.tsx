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
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 transition-opacity duration-200 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
      <Dialog.Viewport
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto sm:items-center"
        data-slot="dialog-viewport"
      >
        <Dialog.Popup
          className={`max-h-[calc(100dvh-1rem)] w-full translate-y-0 rounded-xl border border-border/70 bg-card text-card-foreground shadow-xl outline-none transition-[transform,opacity] duration-200 ease-out data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 motion-reduce:transition-none sm:max-h-[calc(100dvh-2rem)] ${className ?? ''}`}
          initialFocus={initialFocus}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  )
}
