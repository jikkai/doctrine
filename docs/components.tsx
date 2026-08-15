import type { IDoctrineComponents } from '@amamo/doctrine'
import type { ComponentProps } from 'react'
import { Callout } from '@amamo/doctrine/components'
import { useState } from 'react'

function BrandedCallout(props: ComponentProps<typeof Callout>) {
  return <Callout data-doctrine-callout="true" {...props} />
}

function PreviewCounter() {
  const [count, setCount] = useState(0)

  function handleIncrement() {
    setCount((value) => value + 1)
  }

  return (
    <button
      className="inline-flex min-h-10 items-center rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-medium transition-colors hover:bg-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      onClick={handleIncrement}
      type="button"
    >
      Count: {count}
    </button>
  )
}

export default {
  Callout: BrandedCallout,
  PreviewCounter,
} satisfies IDoctrineComponents
