import type { ReactNode } from "react";

import { Dialog } from "@base-ui/react/dialog";

export interface IDialogSurfaceProps {
  children: ReactNode;
  className?: string;
}

export function DialogSurface({ children, className }: IDialogSurfaceProps) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/45 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[12vh]">
        <Dialog.Popup
          className={`w-full rounded-xl border border-border bg-background text-foreground shadow-2xl outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 ${className ?? ""}`}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  );
}
