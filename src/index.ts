import Debug from 'debug'
import path from 'path'
import semver from 'semver'
import { getVersionInstalled, readJson, toArray } from './utils'
import { Dependency, DependencyType } from './types'
import chalk from 'chalk'

const debug = Debug('debug:main')

function analyze (projectDir: string, dep: Dependency) {
  const versionInstalled = getVersionInstalled(projectDir, dep.name) || '-'

  let status = ''

  if (versionInstalled === '-') {
    status = 'missing'
  } else if (!semver.satisfies(versionInstalled, dep.version)) {
    status = 'mismatching'
  }

  debug(chalk.green('dep:'), dep.name, ' ', dep.version, ' ', versionInstalled, ' ', status || '√')

  return { ...dep, versionInstalled, status }
}

export default function verify (projectDir: string, types: DependencyType[] = []) {
  const pkg = readJson(path.join(projectDir, 'package.json'))

  if (types.length === 0) types = ['dependencies', 'devDependencies', 'peerDependencies']

  return types.map((type) => {
    debug(chalk.green(type + ':'))

    const deps = toArray(pkg[type])
      .map((dep) => analyze(projectDir, dep))

    return { type, deps }
  })
}
