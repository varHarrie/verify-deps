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
    --list         -l     List dependencies.
    --debug               Displays debug logs.
    --version      -v     Displays the version.
    --help         -h     Displays the help.

  Example
    $ verify-deps
    $ verify-deps ./my-project
    $ verify-deps ./my-project -dev
    $ verify-deps ./my-project -dev -l
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
    list: {
      type: 'boolean',
      alias: 'l'
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

Promise
  .resolve()
  .then(() => {
    const groups = verify(projectDir, types)
      .map((group) => flags.list ? group : { ...group, deps: group.deps.filter((d) => d.status) })
      .filter((group) => group.deps.length)

    const hasErrors = groups.some((group) => group.deps.some((d) => !!d.status))

    if (hasErrors) {
      spinner.fail('There are some dependencies that is mismatched:\n')
    } else if (flags.list && groups.length) {
      spinner.succeed(`All dependencies:\n`)
    }

    for (const group of groups) {
      const rows = group.deps.map(({ name, version, versionInstalled, status }) => {
        const text = status ? chalk.red('×') + ' ' + status : chalk.green('√')
        return [name, version, versionInstalled, text]
      })

      if (rows.length) showTable(group.type, rows)
    }

    if (hasErrors) {
      log(chalk.red(`\n× Use 'npm install' to update your dependencies.\n`))
    } else {
      log(chalk.green(`\n√ Dependencies all matched!\n`))
    }

    if (flags.version) cli.showVersion()
    if (flags.help) cli.showHelp()

    process.exit(hasErrors ? 1 : 0)
  })

function showTable (title: string, rows: string[][]) {
  const table: any = new Table({
    head: ['Name', 'Expected Version', 'Installed Version', 'Type']
  })

  table.push(...rows)
  log(chalk.inverse(`* ${title} (${rows.length}):`))
  log(table.toString())
}
