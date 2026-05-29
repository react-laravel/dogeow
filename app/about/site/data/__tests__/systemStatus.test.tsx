import { mapApiToSystemStatus } from '../systemStatus'
import type { SystemStatusApiResponse } from '../../types-api'

const createResponse = (): SystemStatusApiResponse => ({
  hermes: {
    name: '小龙虾🦞',
    label: 'Hermes',
    online: true,
    status: 'online',
    details: 'CPU: 10%',
    response_time: 12.5,
  },
  reverb: {
    status: 'online',
    raw_state: 'running',
    details: 'ok',
  },
  queue: {
    status: 'online',
    raw_state: 'running',
    details: 'ok',
  },
  database: {
    status: 'online',
    details: 'ok',
  },
  redis: {
    status: 'online',
    details: 'ok',
  },
  cdn: {
    status: 'online',
    details: 'ok',
  },
  scheduler: {
    status: 'online',
    details: 'ok',
  },
  github: {
    status: 'online',
    details: 'remaining 4999',
  },
})

describe('mapApiToSystemStatus', () => {
  it('maps Hermes display fields from the backend', () => {
    const statuses = mapApiToSystemStatus(createResponse(), new Date('2026-03-10T00:00:00Z'))
    const hermesStatus = statuses.find(item => item.name === '小龙虾🦞')

    expect(hermesStatus).toMatchObject({
      label: 'Hermes',
      status: 'online',
      responseTimeMs: 12.5,
    })
  })

  it('maps the GitHub status when the backend provides it', () => {
    const statuses = mapApiToSystemStatus(createResponse(), new Date('2026-03-10T00:00:00Z'))
    const githubStatus = statuses.find(item => item.name === 'GitHub API')

    expect(githubStatus).toMatchObject({
      status: 'online',
      details: 'remaining 4999',
    })
  })

  it('falls back gracefully when the backend does not provide GitHub status', () => {
    const legacyResponse = createResponse()
    delete legacyResponse.github

    const statuses = mapApiToSystemStatus(legacyResponse, new Date('2026-03-10T00:00:00Z'))
    const githubStatus = statuses.find(item => item.name === 'GitHub API')

    expect(githubStatus).toMatchObject({
      status: 'warning',
      details: '当前后端尚未返回 GitHub API 状态',
    })
  })
})
