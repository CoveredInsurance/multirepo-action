import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import { writeFile, readFile } from 'fs/promises'
import { parse } from 'yaml'
import type { MintConfig } from '@mintlify/models'
import path from 'path'
import mergeConfigs from './mergeConfigs.js'

type Repo = {
  owner: string
  repo: string
  ref?: string
  subdirectory?: string
}

const execOrThrow: (
  ...args: Parameters<typeof exec.exec>
) => Promise<void> = async (...args) => {
  core.info(`Executing command: ${args[0]} ${args[1]?.join(' ') ?? ''}`)
  const exitCode = await exec.exec(...args)
  if (exitCode !== 0)
    throw Error(`error running command: ${args[0]} ${args[1]?.join(' ') ?? ''}`)
}

const setToken = async (token: string) => {
  core.info('Setting GitHub token')
  const encodedToken = Buffer.from(`x-access-token:${token}`, 'utf-8').toString(
    'base64'
  )
  core.setSecret(encodedToken)
  const headerPlaceholder = 'Authorization: basic ***'
  const headerValue = `Authorization: basic ${encodedToken}`
  const headerKey = 'http.https://github.com/.extraheader'
  const configPath = '.git/config'

  await execOrThrow('git', ['config', '--local', headerKey, headerPlaceholder])
  const configString = await readFile(configPath, 'utf-8')
  await writeFile(
    configPath,
    configString.replace(headerPlaceholder, headerValue)
  )

  return () =>
    execOrThrow('git', ['config', '--local', '--unset-all', headerKey])
}

const checkoutBranch = async (branch: string) => {
  core.info(`Checking out branch: ${branch}`)
  try {
    await execOrThrow('git', [
      'ls-remote',
      '--heads',
      '--exit-code',
      'origin',
      branch
    ])
    await execOrThrow('git', ['fetch', '-u', 'origin', `${branch}:${branch}`])
    await execOrThrow('git', ['symbolic-ref', 'HEAD', `refs/heads/${branch}`])
  } catch {
    await execOrThrow('git', ['checkout', '-b', branch])
  }
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    let resetToken
    try {
      const token = core.getInput('token')
      const repos = parse(core.getInput('repos')) as Repo[]
      const targetBranch = core.getInput('target-branch')
      const subdirectory = core.getInput('subdirectory')
      const force = core.getBooleanInput('force')

      core.info(`Changing directory to: ${subdirectory}`)
      process.chdir(subdirectory)

      await checkoutBranch(targetBranch)

      const mainConfig = JSON.parse(
        await readFile('docs.json', 'utf-8')
      ) as MintConfig

      let wipConfig = mainConfig
      resetToken = await setToken(token)
      for (const {
        owner,
        repo,
        ref,
        subdirectory: subrepoSubdirectory
      } of repos) {
        core.info(`Processing repository: ${owner}/${repo}`)
        await io.rmRF(repo)

        const args = ['clone', '--depth=1']
        if (ref) args.push('--branch', ref)
        const url = `https://oauth2:${token}@github.com/${owner}/${repo}`
        args.push(url)
        core.info(`url is: ${url}`)

        await execOrThrow('git', args)

        if (subrepoSubdirectory) {
          core.info(`Looking in subrepoSubdirectory: ${subrepoSubdirectory} `)
          const tempDirName = 'temporary-docs-dir'
          await io.mv(path.join(repo, subrepoSubdirectory), tempDirName)
          await io.rmRF(repo)
          await io.mv(tempDirName, repo)
        } else {
          core.info('No subdirectory specified')
          await io.rmRF(`${repo}/.git`)
        }

        const subConfig = JSON.parse(
          await readFile(path.join(repo, 'docs.json'), 'utf-8')
        ) as MintConfig

        core.info(`Read subConfig of ${repo}, merging navigation...`)
        wipConfig = mergeConfigs(wipConfig, subConfig, repo)
      }

      core.info('Writing updated docs.json')
      await writeFile('docs.json', JSON.stringify(wipConfig, null, 2))

      core.info('Committing changes...')
      await execOrThrow('git', ['add', '.'])
      try {
        ;(await exec.exec('git', [
          'diff-index',
          '--quiet',
          '--cached',
          'HEAD',
          '--'
        ])) !== 0
        core.info('No changes detected, skipping commit...')
      } catch {
        await execOrThrow('git', ['config', 'user.name', 'Mintie Bot'])
        await execOrThrow('git', ['config', 'user.email', 'aws@mintlify.com'])
        await execOrThrow('git', ['commit', '-m', 'update'])

        const pushArgs = ['push']
        if (force) pushArgs.push('--force')
        pushArgs.push('origin', targetBranch)
        core.info('Pushing changes...')
        await execOrThrow('git', pushArgs)
      }
    } catch (error) {
      const message =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : JSON.stringify(error, null, 2)
      core.setFailed(message)
    } finally {
      resetToken?.()
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
