import type { HTMLAttributes, ReactNode } from 'react'
import { FileIcon, FolderIcon } from 'lucide-react'

export interface IFileTreeProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function FileTree({ children, className, ...props }: IFileTreeProps) {
  return (
    <div
      className={`overflow-x-auto rounded-lg border border-border/70 bg-card/40 p-3 font-mono text-[0.8125rem] leading-6 ${className ?? ''}`}
      {...props}
      data-slot="file-tree"
    >
      <ul className="m-0 min-w-max list-none p-0" data-slot="file-tree-list">
        {children}
      </ul>
    </div>
  )
}

export interface IFileTreeFolderProps extends HTMLAttributes<HTMLLIElement> {
  children: ReactNode
  name: ReactNode
}

export function FileTreeFolder({ children, className, name, ...props }: IFileTreeFolderProps) {
  return (
    <li className={className} {...props} data-slot="file-tree-folder">
      <div className="flex items-center gap-2 rounded-sm px-2 py-1 text-foreground">
        <FolderIcon aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
        <span>{name}</span>
      </div>
      <ul className="m-0 ml-4 list-none border-l border-border/60 py-0 pl-3">{children}</ul>
    </li>
  )
}

export interface IFileTreeFileProps extends HTMLAttributes<HTMLLIElement> {
  active?: boolean
  name: ReactNode
}

export function FileTreeFile({ active = false, className, name, ...props }: IFileTreeFileProps) {
  return (
    <li
      className={`flex items-center gap-2 rounded-sm px-2 py-1 text-muted-foreground ${active ? 'bg-accent/60 font-medium text-accent-foreground' : ''} ${className ?? ''}`}
      {...props}
      aria-current={active ? 'true' : undefined}
      data-slot="file-tree-file"
    >
      <FileIcon aria-hidden="true" className="size-3.5 shrink-0" />
      <span>{name}</span>
    </li>
  )
}
