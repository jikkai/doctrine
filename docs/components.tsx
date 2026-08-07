import type { IDoctrineComponents } from '@amamo/doctrine'
import type { ComponentProps } from 'react'
import { Callout } from '@amamo/doctrine/components'

function BrandedCallout(props: ComponentProps<typeof Callout>) {
  return <Callout data-doctrine-callout="true" {...props} />
}

export default { Callout: BrandedCallout } satisfies IDoctrineComponents
