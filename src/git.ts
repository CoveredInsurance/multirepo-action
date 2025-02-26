import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { writeFile, readFile } from 'fs/promises'

export const execOrThrow: (
  ...args: Parameters<typeof exec.exec>
) => Promise<void> = async (...args) => {
  core.info(`Executing command: ${args[0]} ${args[1]?.join(' ') ?? ''}`)
  const exitCode = await exec.exec(...args)
  if (exitCode !== 0)
    throw Error(`error running command: ${args[0]} ${args[1]?.join(' ') ?? ''}`)
}

const headerKey = 'http.https://github.com/.extraheader'
export const setToken = async (token: string) => {
  core.info('Setting GitHub token')
  const encodedToken = Buffer.from(`x-access-token:${token}`, 'utf-8').toString(
    'base64'
  )
  core.setSecret(encodedToken)
  const headerPlaceholder = 'Authorization: basic ***'
  const headerValue = `Authorization: basic ${encodedToken}`
  const configPath = '.git/config'

  await execOrThrow('git', ['config', '--local', headerKey, headerPlaceholder])
  const configString = await readFile(configPath, 'utf-8')
  await writeFile(
    configPath,
    configString.replace(headerPlaceholder, headerValue)
  )
}
export const clearToken = async () => {
  await execOrThrow('git', ['config', '--local', '--unset-all', headerKey])
}

export const checkoutBranch = async (branch: string) => {
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

export const stagedChangesExist = async () => {
  const exitCode = await exec.exec(
    'git',
    ['diff-index', '--quiet', '--cached', 'HEAD', '--'],
    { ignoreReturnCode: true }
  )

  return exitCode !== 0
}

export const commitAndPush = async (targetBranch: string, force: boolean) => {
  core.info('Committing changes...')
  await execOrThrow('git', ['add', '.'])
  if ((await stagedChangesExist()) == false) {
    core.info('No changes detected, skipping commit...')
  } else {
    await execOrThrow('git', ['config', 'user.name', 'Mintie Bot'])
    await execOrThrow('git', ['config', 'user.email', 'aws@mintlify.com'])
    await execOrThrow('git', ['commit', '-m', 'update'])

    const pushArgs = ['push']
    if (force) pushArgs.push('--force')
    pushArgs.push('origin', targetBranch)
    core.info('Pushing changes...')
    await execOrThrow('git', pushArgs)
  }
}

export const clone = async (
  token: string,
  owner: string,
  repo: string,
  branch: string = 'main'
) => {
  const args = ['clone', '--depth=1']
  if (branch) args.push('--branch', branch)
  const url = `https://oauth2:${token}@github.com/${owner}/${repo}`
  args.push(url)
  core.info(`url is: ${url}`)

  await execOrThrow('git', args)
}
