import path from 'path'
import semver from 'semver'
import { getVersionInstalled, readJson, toArray } from './utils'
import { Dependency, DependencyType } from './types'

function analyze (projectDir: string, dep: Dependency) {
  const versionInstalled = getVersionInstalled(projectDir, dep.name) || '-'
  const versionExpected = dep.version.replace(/^[\^~]/, '')

  let type = ''

  if (versionInstalled === '-') {
    type = 'missing'
  } else if (semver.valid(versionExpected)) {
    type = semver.diff(versionInstalled, versionExpected) || ''
  } else {
    type = semver.satisfies(versionInstalled, dep.version) ? '' : 'mismatching'
  }

  return { ...dep, versionInstalled, type }
}

export default function verify (projectDir: string, types: DependencyType[] = []) {
  const pkg = readJson(path.join(projectDir, 'package.json'))

  if (types.length === 0) types = ['dependencies']

  return types.map((type) => {
    const deps = toArray(pkg[type])
      .map((dep) => analyze(projectDir, dep))

    return { type, deps }
  })
}
