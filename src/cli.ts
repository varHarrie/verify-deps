import chalk from 'chalk'
import Debug from 'debug'
import meow from 'meow'
import ora from 'ora'
import path from 'path'
import Table from 'cli-table3'

import verify from './index'
import { DependencyType } from './types'

const log = console.log
const debug = Debug('debug:cli')

const cli = meow(`
  Usage
    $ verify-deps <project-dir> [options]

  Options
    --development  -dev   Checks for devDependencies.
    --production   -prod  Checks for dependencies.
    --peer                Checks for peerDependencies.
    --debug               Displays debug logs.
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
    }
  }
})

const { input, flags } = cli
const cwd = process.cwd()

const types: DependencyType[] = []

if (flags.debug) Debug.enable('debug:*')
if (flags.development) types.push('devDependencies')
if (flags.production) types.push('dependencies')
if (flags.peer) types.push('peerDependencies')

let projectDir = input[0] || '.'
if (projectDir[0] === '.') projectDir = path.join(cwd, projectDir)

debug(chalk.green('projectDir:'), projectDir)
debug(chalk.green('flags:'), flags)

const spinner = ora('Verifying dependencies...\n').start()

const results = verify(projectDir, types)
  .map((r) => ({ ...r, deps: r.deps.filter((d) => d.status) }))
  .filter((r) => r.deps.length)

log('\n')

if (results.length) {
  spinner.fail(`The following dependencies are mismatched:`)

  results.forEach((r) => {
    const table: any = new Table({
      head: ['Name', 'Expected Version', 'Installed Version', 'Type']
    })

    table.push(
      ...r.deps
        .map((d) => [d.name, d.version, d.versionInstalled, chalk.red('×') + ' ' + d.status])
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
