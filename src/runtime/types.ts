import type { ComponentProps, ComponentType } from 'react'

import type { IDoctrineComponents, IDoctrineLocaleConfig } from '../config.js'
import type { DoctrineNavigation } from '../navigation.js'

export interface IRuntimeConfig {
  base: string
  copyright?: string
  description: string
  dev: boolean
  githubSourceRoot?: string
  githubUrl?: string
  locales: IDoctrineLocaleConfig
  navigation: DoctrineNavigation
  pageActions: boolean
  siteUrl: string
  title: string
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
  source?: IDocumentSource
  standalone: boolean
  title: string
}

export interface IDocumentSource {
  githubUrl?: string
  markdownPath: string
  sourcePath: string
}

export type DoctrineIconComponent = ComponentType<ComponentProps<'svg'>>

export type DoctrineIcons = Readonly<Record<string, DoctrineIconComponent>>

export interface IPageAssets {
  scripts: string[]
  styles: string[]
}
