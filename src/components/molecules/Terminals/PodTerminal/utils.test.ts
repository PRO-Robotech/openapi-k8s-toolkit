import { getScopedContainerNames } from './utils'

describe('getScopedContainerNames', () => {
  test('returns all containers when no container name is provided', () => {
    expect(getScopedContainerNames(['api', 'worker'])).toEqual(['api', 'worker'])
  })

  test('returns all containers when container name is blank', () => {
    expect(getScopedContainerNames(['api', 'worker'], '   ')).toEqual(['api', 'worker'])
  })

  test('returns only the requested container', () => {
    expect(getScopedContainerNames(['api', 'worker'], 'worker')).toEqual(['worker'])
  })

  test('returns an empty list when the requested container is absent', () => {
    expect(getScopedContainerNames(['api', 'worker'], 'cron')).toEqual([])
  })
})
