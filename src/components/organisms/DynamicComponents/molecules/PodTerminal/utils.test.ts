/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRunningContainerNames } from './utils'

describe('getRunningContainerNames', () => {
  test('returns only running container names', () => {
    const pod = {
      status: {
        containerStatuses: [
          { name: 'c1', state: { running: {} } },
          { name: 'c2', state: { terminated: {} } },
          { name: 'c3' }, // no state
          { name: 'c4', state: { running: { startedAt: 'x' } } },
        ],
      },
    } as any

    expect(getRunningContainerNames(pod)).toEqual(['c1', 'c4'])
  })

  test('returns empty array when status is missing', () => {
    const pod = {} as any
    expect(getRunningContainerNames(pod)).toEqual([])
  })

  test('returns empty array when containerStatuses is missing', () => {
    const pod = { status: {} } as any
    expect(getRunningContainerNames(pod)).toEqual([])
  })

  test('returns empty array when none are running', () => {
    const pod = {
      status: {
        containerStatuses: [
          { name: 'c1', state: { waiting: {} } },
          { name: 'c2', state: { terminated: {} } },
        ],
      },
    } as any

    expect(getRunningContainerNames(pod)).toEqual([])
  })
})
