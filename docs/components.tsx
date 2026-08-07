import type { IDoctrineComponents } from "@amamo/doctrine";
import type { ReactNode } from "react";

function Callout({ children }: { children: ReactNode }) {
  return (
    <aside
      className="my-6 rounded-lg border border-border bg-muted px-4 py-3 text-sm"
      data-doctrine-callout="true"
    >
      {children}
    </aside>
  );
}

export default { Callout } satisfies IDoctrineComponents;
