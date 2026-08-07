import type { ReactNode } from "react";

import * as BaseButton from "@base-ui/react/button";

export interface IButtonProps extends BaseButton.Button.Props {
  children?: ReactNode;
  variant?: "ghost" | "outline";
}

const VARIANTS = {
  ghost: "border-transparent bg-transparent hover:bg-muted",
  outline: "border-border bg-background hover:bg-muted",
} as const;

export function Button({ className, variant = "ghost", ...props }: IButtonProps) {
  return (
    <BaseButton.Button
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
