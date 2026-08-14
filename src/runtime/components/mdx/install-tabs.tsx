import { CodeBlockPre } from './code-block.js'
import { Tab, Tabs } from './tabs.js'

export interface IInstallTabsProps {
  dev?: boolean
  packageName: string
}

const PACKAGE_MANAGERS = [
  { command: 'pnpm add', devFlag: '-D', name: 'pnpm' },
  { command: 'npm install', devFlag: '-D', name: 'npm' },
  { command: 'yarn add', devFlag: '-D', name: 'yarn' },
  { command: 'bun add', devFlag: '-d', name: 'bun' },
] as const

export function InstallTabs({ dev = false, packageName }: IInstallTabsProps) {
  return (
    <Tabs defaultValue="pnpm">
      {PACKAGE_MANAGERS.map((manager) => (
        <Tab key={manager.name} label={manager.name} value={manager.name}>
          <CodeBlockPre data-language="sh">
            <code>{`${manager.command}${dev ? ` ${manager.devFlag}` : ''} ${packageName}`}</code>
          </CodeBlockPre>
        </Tab>
      ))}
    </Tabs>
  )
}
