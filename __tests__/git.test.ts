import { jest } from '@jest/globals'
import type * as exec from '@actions/exec'
import * as core from '../__fixtures__/core.js'

const execMock = jest.fn<typeof exec.exec>()

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => ({ exec: execMock }))

const { clone } = await import('../src/git.js')

const token = 'ghp_exampleSecretTokenValue0123456789'
const encodedToken = Buffer.from(`x-access-token:${token}`, 'utf-8').toString(
  'base64'
)

describe('clone', () => {
  beforeEach(() => {
    execMock.mockResolvedValue(0)
  })

  test('does not embed the token in the clone URL or arguments', async () => {
    await clone(token, 'owner', 'repo', 'main')

    const [command, args] = execMock.mock.calls[0]
    expect(command).toBe('git')
    expect(args).toStrictEqual([
      'clone',
      '--depth=1',
      '--branch',
      'main',
      'https://github.com/owner/repo'
    ])
    expect(JSON.stringify(args)).not.toContain(token)
    expect(JSON.stringify(args)).not.toContain(encodedToken)
  })

  test('does not write the token to the log', async () => {
    await clone(token, 'owner', 'repo')

    expect(core.info).toHaveBeenCalled()
    for (const [message] of core.info.mock.calls) {
      expect(message).not.toContain(token)
      expect(message).not.toContain(encodedToken)
    }
  })

  test('masks the token and passes credentials through the environment', async () => {
    await clone(token, 'owner', 'repo')

    expect(core.setSecret).toHaveBeenCalledWith(token)
    expect(core.setSecret).toHaveBeenCalledWith(encodedToken)

    const [, , options] = execMock.mock.calls[0]
    expect(options?.env).toMatchObject({
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
      GIT_CONFIG_VALUE_0: `Authorization: basic ${encodedToken}`
    })
  })
})
