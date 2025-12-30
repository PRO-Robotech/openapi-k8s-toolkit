/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRunningContainerNames } from './utils'

describe('getRunningContainerNames', () => {
  test('returns running containers and all init containers', () => {
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

    expect(getRunningContainerNames(pod)).toEqual({
      containers: ['c1', 'c4'],
      initContainers: ['i1', 'i2'],
    })
  })

  test('handles missing status gracefully', () => {
    const pod = {} as any

    expect(getRunningContainerNames(pod)).toEqual({
      containers: [],
      initContainers: [],
    })
  })

  test('handles missing containerStatuses and initContainerStatuses', () => {
    const pod = { status: {} } as any

    expect(getRunningContainerNames(pod)).toEqual({
      containers: [],
      initContainers: [],
    })
  })

  test('returns empty containers when none are running', () => {
    const pod = {
      status: {
        containerStatuses: [
          { name: 'c1', state: { waiting: {} } },
          { name: 'c2', state: { terminated: {} } },
        ],
        initContainerStatuses: [],
      },
    } as any

    expect(getRunningContainerNames(pod)).toEqual({
      containers: [],
      initContainers: [],
    })
  })
})
