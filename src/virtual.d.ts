declare module 'virtual:doctrine/content' {
  import type { IGeneratedDocument } from './runtime/types.js'

  export const documents: readonly IGeneratedDocument[]
}

declare module 'virtual:doctrine/config' {
  import type { IRuntimeConfig } from './runtime/types.js'

  const config: IRuntimeConfig
  export default config
}

declare module 'virtual:doctrine/components' {
  import type { IDoctrineComponents } from './config.js'

  const components: IDoctrineComponents
  export default components
}

declare module 'virtual:doctrine/icons' {
  import type { DoctrineIcons } from './runtime/types.js'

  const icons: DoctrineIcons
  export default icons
}

declare module 'virtual:doctrine/custom-styles.css' {}

declare module 'virtual:doctrine/styles.css' {}
