import type { IHomeProps } from './home'
import { Home } from './home'

export default function HomePage(props: Pick<IHomeProps, 'components'>) {
  return <Home {...props} locale="en" />
}
