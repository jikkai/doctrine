#!/usr/bin/env node

import process from 'node:process'

import { build } from './build.js'
import { loadDoctrineConfig, normalizeDoctrineConfig } from './config.js'
import { dev } from './dev.js'

interface ICliOptions {
  directory: string
  host: string
  outDir?: string
  port: number
  siteUrl?: string
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2)
  if (!command || command === '--help' || command === '-h') {
    printHelp()
    return
  }
  if (command !== 'build' && command !== 'dev') throw new Error(`Unknown command: ${command}`)

  const options = parseOptions(args)
  const root = process.cwd()
  const userConfig = await loadDoctrineConfig(root, command === 'build' ? 'build' : 'serve')
  const config = await normalizeDoctrineConfig(userConfig, {
    contentDirectory: options.directory,
    outDir: options.outDir,
    root,
    siteUrl: options.siteUrl,
  })

  if (command === 'build') {
    const result = await build(config)
    console.log(`Built ${result.pages} pages in ${result.outDir}`)
    return
  }
  await dev(config, { host: options.host, port: options.port })
}

function parseOptions(args: string[]): ICliOptions {
  const options: ICliOptions = {
    directory: 'docs',
    host: 'localhost',
    port: 5173,
  }
  let directorySet = false
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (!argument) continue
    if (!argument.startsWith('-')) {
      if (directorySet) throw new Error(`Unexpected argument: ${argument}`)
      options.directory = argument
      directorySet = true
      continue
    }
    const value = args[index + 1]
    if (!value || value.startsWith('-')) throw new Error(`Missing value for ${argument}`)
    index += 1
    if (argument === '--host') options.host = value
    else if (argument === '--out-dir') options.outDir = value
    else if (argument === '--port') {
      const port = Number(value)
      if (!Number.isInteger(port) || port < 0 || port > 65_535)
        throw new Error(`Invalid port: ${value}`)
      options.port = port
    } else if (argument === '--site-url') options.siteUrl = value
    else throw new Error(`Unknown option: ${argument}`)
  }
  return options
}

function printHelp(): void {
  console.log(`@amamo/doctrine

Usage:
  doctrine dev [directory] [--host localhost] [--port 5173]
  doctrine build [directory] [--site-url https://example.com/docs/] [--out-dir dist]`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
