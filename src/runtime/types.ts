import type { ComponentType } from 'react'

import type {
  DoctrineLocalizedText,
  IDoctrineComponents,
  IDoctrineLocaleConfig,
} from '../config.js'

export interface IRuntimeConfig {
  base: string
  copyright?: DoctrineLocalizedText
  description: DoctrineLocalizedText
  dev: boolean
  githubUrl?: string
  locales: IDoctrineLocaleConfig
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
}

export interface IDocumentRoute {
  description?: string
  document: IGeneratedDocument
  locale: string
  order: number
  path: string
  slug: string
  title: string
}

export interface IPageAssets {
  scripts: string[]
  styles: string[]
}
