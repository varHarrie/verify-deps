import fs from 'fs'
import path from 'path'
import { Dependency } from './types'

export function readJson (file: string) {
  const text = fs.readFileSync(file, 'utf-8')
  return JSON.parse(text)
}

export function toArray (obj: any) {
  const deps: Dependency[] = Object.keys(obj || {})
    .map((key) => ({ name: key, version: obj[key] }))
  return deps
}

export function getVersionInstalled (projectDir: string, depName: string) {
  let version = ''

  try {
    const json = readJson(path.join(projectDir, 'node_modules', depName, 'package.json'))
    version = json.version || ''
  } catch {/* do nothing */}

  return version
}
