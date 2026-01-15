/* eslint-disable @typescript-eslint/no-explicit-any */
import { getContainerNames } from './utils'

describe('getContainerNames', () => {
  test('returns all containers regardless of state and all init containers', () => {
    const pod = {
      status: {
        containerStatuses: [
          { name: 'c1', state: { running: {} } },
          { name: 'c2', state: { terminated: {} } },
          { name: 'c3' }, // no state
          { name: 'c4', state: { running: { startedAt: 'x' } } },
        ],
        initContainerStatuses: [{ name: 'i1' }, { name: 'i2' }],
      },
    } as any

    expect(getContainerNames(pod)).toEqual({
      containers: ['c1', 'c2', 'c3', 'c4'],
      initContainers: ['i1', 'i2'],
    })
  })

  test('handles missing status gracefully', () => {
    const pod = {} as any

    expect(getContainerNames(pod)).toEqual({
      containers: [],
      initContainers: [],
    })
  })

  test('handles missing containerStatuses and initContainerStatuses', () => {
    const pod = { status: {} } as any

    expect(getContainerNames(pod)).toEqual({
      containers: [],
      initContainers: [],
    })
  })

  test('returns all containers even when none are running', () => {
    const pod = {
      status: {
        containerStatuses: [
          { name: 'c1', state: { waiting: {} } },
          { name: 'c2', state: { terminated: {} } },
        ],
        initContainerStatuses: [],
      },
    } as any

    expect(getContainerNames(pod)).toEqual({
      containers: ['c1', 'c2'],
      initContainers: [],
    })
  })
})
