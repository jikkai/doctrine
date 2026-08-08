import type { TableHTMLAttributes } from 'react'
import { useContext } from 'react'

import { DoctrineLocaleContext } from './context.js'

export function ResponsiveTable(props: TableHTMLAttributes<HTMLTableElement>) {
  const locale = useContext(DoctrineLocaleContext)
  const label = locale.toLowerCase().startsWith('zh') ? '可横向滚动的表格' : 'Scrollable table'
  return (
    <section aria-label={label} className="max-w-full overflow-x-auto" data-slot="table-scroll">
      <table {...props} />
    </section>
  )
}
