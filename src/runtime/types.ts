import type { ComponentProps, ComponentType } from 'react'

import type {
  DoctrineLocalizedText,
  IDoctrineComponents,
  IDoctrineLocaleConfig,
} from '../config.js'
import type { DoctrineNavigation } from '../navigation.js'

export interface IRuntimeConfig {
  base: string
  copyright?: DoctrineLocalizedText
  description: DoctrineLocalizedText
  dev: boolean
  githubUrl?: string
  locales: IDoctrineLocaleConfig
  navigation: DoctrineNavigation
  siteUrl: string
  title: DoctrineLocalizedText
}

export interface IMdxContentProps {
  components?: IDoctrineComponents
}

export interface IDocumentModule {
  default: ComponentType<IMdxContentProps>
}

export interface IGeneratedDocument {
  derived: Readonly<Record<string, unknown>>
  frontmatter: Readonly<Record<string, unknown>>
  key: string
  load: () => Promise<IDocumentModule>
  locale?: string
  slug?: string
  standalone?: boolean
}

export interface IDocumentRoute {
  description?: string
  document: IGeneratedDocument
  locale: string
  path: string
  slug: string
  standalone: boolean
  title: string
}

export type DoctrineIconComponent = ComponentType<ComponentProps<'svg'>>

export type DoctrineIcons = Readonly<Record<string, DoctrineIconComponent>>

export interface IPageAssets {
  scripts: string[]
  styles: string[]
}
