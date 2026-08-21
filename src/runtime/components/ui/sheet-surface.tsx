import type { ReactNode } from 'react'

import { Dialog } from '@base-ui/react/dialog'

export interface ISheetSurfaceProps {
  children: ReactNode
  className?: string
}

export function SheetSurface({ children, className }: ISheetSurfaceProps) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none dark:bg-background/70" />
      <Dialog.Popup
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-full flex-col bg-sidebar text-sidebar-foreground shadow-2xl shadow-foreground/10 outline-none transition-[transform,opacity] duration-150 data-ending-style:-translate-x-4 data-ending-style:opacity-0 data-starting-style:-translate-x-4 data-starting-style:opacity-0 motion-reduce:transition-none ${className ?? ''}`}
        data-slot="sheet-surface"
      >
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  )
}
