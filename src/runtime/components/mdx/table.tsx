import type { TableHTMLAttributes } from 'react'
import { useContext } from 'react'

import { DoctrineLocaleContext } from './context.js'

export function ResponsiveTable(props: TableHTMLAttributes<HTMLTableElement>) {
  const locale = useContext(DoctrineLocaleContext)
  const label = locale.toLowerCase().startsWith('zh') ? '可横向滚动的表格' : 'Scrollable table'
  return (
    <section
      aria-label={label}
      className="my-5 max-w-full overflow-x-auto rounded-lg border border-separator"
      data-slot="table-scroll"
    >
      <table {...props} />
    </section>
  )
}
