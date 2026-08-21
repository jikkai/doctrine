import { stat } from 'node:fs/promises'
import path from 'node:path'

export function resolveOutputFile(root: string, pathname: string): string {
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\'),
    )
  ) {
    throw new Error(`Unsafe output path: ${pathname}`)
  }
  const file = path.resolve(root, ...segments)
  const relative = path.relative(root, file)
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Output path escapes its root: ${pathname}`)
  }
  return file
}

export async function findOutputConflict(
  root: string,
  pathname: string,
): Promise<string | undefined> {
  const file = resolveOutputFile(root, pathname)
  let current = file
  while (true) {
    const value = await stat(current).catch(() => undefined)
    if (value) {
      if (current === file || !value.isDirectory()) return current
      return undefined
    }
    if (current === root) return undefined
    current = path.dirname(current)
  }
}
