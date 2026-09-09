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

// Registers both the raw token and its encoded form with the runner's log
// masker before either is used anywhere.
const basicAuthHeader = (token: string) => {
  core.setSecret(token)
  const encodedToken = Buffer.from(`x-access-token:${token}`, 'utf-8').toString(
    'base64'
  )
  core.setSecret(encodedToken)
  return `Authorization: basic ${encodedToken}`
}

export const setToken = async (token: string) => {
  core.info('Setting GitHub token')
  const headerPlaceholder = 'Authorization: basic ***'
  const headerValue = basicAuthHeader(token)
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
  args.push(`https://github.com/${owner}/${repo}`)

  // The credential travels via git's environment-based config rather than the
  // URL or argv, so it never reaches the command echo or the Actions log.
  await execOrThrow('git', args, {
    env: {
      ...(process.env as Record<string, string>),
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: headerKey,
      GIT_CONFIG_VALUE_0: basicAuthHeader(token)
    }
  })
}
