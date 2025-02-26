import * as core from '@actions/core'
import * as io from '@actions/io'
import { writeFile, readFile } from 'fs/promises'
import { parse } from 'yaml'
import type { MintConfig } from '@mintlify/models'
import path from 'path'
import mergeConfigs from './mergeConfigs.js'
import * as git from './git.js'

type Repo = {
  owner: string
  repo: string
  ref?: string
  subdirectory?: string
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
    const repos = parse(core.getInput('repos')) as Repo[]
    const targetBranch = core.getInput('target-branch')
    const subdirectory = core.getInput('subdirectory')
    const force = core.getBooleanInput('force')

    core.info(`Changing directory to: ${subdirectory}`)
    process.chdir(subdirectory)

    await git.checkoutBranch(targetBranch)

    const mainConfig = JSON.parse(
      await readFile('docs.json', 'utf-8')
    ) as MintConfig

    await git.setToken(token)
    let wipConfig = mainConfig
    for (const {
      owner,
      repo,
      ref: branch,
      subdirectory: subrepoSubdirectory
    } of repos) {
      core.info(`Processing repository: ${owner}/${repo}`)
      await io.rmRF(repo)

      await git.clone(token, owner, repo, branch)

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
      core.info(`merged subconfig of ${repo}`)
      core.info(`subconfig: ${JSON.stringify(subConfig, null, 2)}`)
    }

    core.info('Writing updated docs.json')
    await writeFile('docs.json', JSON.stringify(wipConfig, null, 2))

    await git.commitAndPush(targetBranch, force)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  } finally {
    await git.clearToken()
  }
}
