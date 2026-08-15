import type { IDoctrineComponents } from '../../../config.js'
import { Badge } from './badge.js'
import { Callout } from './callout.js'
import { Card, CardGrid } from './card.js'
import { CodeBlock, CodeBlockPre } from './code-block.js'
import { FileTree, FileTreeFile, FileTreeFolder } from './file-tree.js'
import { MdxHeading2, MdxHeading3 } from './heading.js'
import { InstallTabs } from './install-tabs.js'
import { LivePreview } from './live-preview.js'
import { Step, Steps } from './steps.js'
import { ResponsiveTable } from './table.js'
import { Tab, Tabs } from './tabs.js'

export const builtinMdxComponents = {
  Badge,
  Callout,
  Card,
  CardGrid,
  CodeBlock,
  FileTree,
  FileTreeFile,
  FileTreeFolder,
  InstallTabs,
  LivePreview,
  Step,
  Steps,
  Tab,
  Tabs,
  h2: MdxHeading2,
  h3: MdxHeading3,
  pre: CodeBlockPre,
  table: ResponsiveTable,
} satisfies IDoctrineComponents
