import chalk from 'chalk'
import meow from 'meow'
import ora from 'ora'
import path from 'path'
import Table from 'cli-table3'

import verify from './index'
import { DependencyType } from './types'

const log = console.log

const cli = meow(`
  Usage
    $ verify-deps <project-dir> [options]

  Options
    --development  -dev   Checks for devDependencies.
    --production   -prod  Checks for dependencies.
    --peer                Checks for peerDependencies.
    --all          -a     Checks for all dependencies.
    --version      -v     Displays the version.
    --help         -h     Displays the help.

  Example
    $ verify-deps
    $ verify-deps ./my-project
    $ verify-deps ./my-project -dev
`, {
  flags: {
    development: {
      type: 'boolean',
      alias: 'dev'
    },
    production: {
      type: 'boolean',
      alias: 'prod'
    },
    all: {
      type: 'boolean',
      alias: 'a'
    }
  }
})

const { input, flags } = cli
const cwd = process.cwd()

const types: DependencyType[] = []

if (flags.development || flags.all) types.push('devDependencies')
if (flags.production || flags.all) types.push('dependencies')
if (flags.peer || flags.all) types.push('peerDependencies')

let projectDir = input[0] || '.'
if (projectDir[0] === '.') projectDir = path.join(cwd, projectDir)

const spinner = ora('Verifying dependencies...').start()

const result = verify(projectDir, types)
  .map((r) => ({ ...r, deps: r.deps.filter((d) => d.type) }))
  .filter((r) => r.deps.length)

log('\n')

if (result.length) {
  spinner.fail(`The following dependencies are mismatched:`)

  result.forEach((r) => {
    const table: any = new Table({
      head: ['Name', 'Expected Version', 'Installed Version', 'Type']
    })

    table.push(
      ...r.deps
        .map((d) => [d.name, d.version, d.versionInstalled, d.type])
    )

    log(chalk.inverse(`* ${r.type} (${r.deps.length}):`))
    log(table.toString())
  })

  log(chalk.red(`\nUse 'npm run install' to update your dependencies.\n`))
  process.exit(1)
}

spinner.succeed('Dependencies all matched!\n')

if (flags.version) cli.showVersion()
if (flags.help) cli.showHelp()

process.exit(0)
