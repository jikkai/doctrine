import assert from 'node:assert/strict'

import { renderToStaticMarkup } from 'react-dom/server'
import { test } from 'vitest'

import { InstallTabs } from '../install-tabs.js'

test('renders install commands for each supported package manager', () => {
  const dependencies = renderToStaticMarkup(<InstallTabs packageName="@amamo/doctrine" />)
  const devDependencies = renderToStaticMarkup(<InstallTabs dev packageName="tailwindcss" />)

  for (const command of [
    'pnpm add @amamo/doctrine',
    'npm install @amamo/doctrine',
    'yarn add @amamo/doctrine',
    'bun add @amamo/doctrine',
  ]) {
    assert.match(dependencies, new RegExp(command))
  }
  for (const command of [
    'pnpm add -D tailwindcss',
    'npm install -D tailwindcss',
    'yarn add -D tailwindcss',
    'bun add -d tailwindcss',
  ]) {
    assert.match(devDependencies, new RegExp(command))
  }
})
