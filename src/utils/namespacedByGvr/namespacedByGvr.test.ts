/* eslint-disable @typescript-eslint/no-explicit-any */
import { namespacedByGvr } from './namespacedByGvr'

// Minimal builder matching the fields used by namespacedByGvr
const e = (group: string, version: string, resource: string, namespaced: boolean) =>
  ({
    group,
    version: {
      version,
      resource,
      namespaced,
    },
  }) as any

describe('namespacedByGvr', () => {
  test('returns undefined when no entries match', () => {
    const fn = namespacedByGvr([e('apps', 'v1', 'deployments', true)])
    expect(fn('batch~v1~jobs')).toBeUndefined()
  })

  test('returns boolean when exactly one unique namespaced value exists', () => {
    const fn = namespacedByGvr([
      e('apps', 'v1', 'deployments', true),
      e('apps', 'v1', 'deployments', true), // duplicate same value ok
    ])

    expect(fn('apps~v1~deployments')).toBe(true)
  })

  test('returns undefined when matching entries disagree on namespaced flag', () => {
    const fn = namespacedByGvr([e('apps', 'v1', 'deployments', true), e('apps', 'v1', 'deployments', false)])

    expect(fn('apps~v1~deployments')).toBeUndefined()
  })

  test('supports core group with empty group prefix in gvr', () => {
    const fn = namespacedByGvr([e('', 'v1', 'pods', true)])

    // "~v1~pods" means group = ""
    expect(fn('~v1~pods')).toBe(true)
  })

  test('trims group input for matching', () => {
    const fn = namespacedByGvr([e('apps', 'v1', 'deployments', true)])

    expect(fn('  apps  ~v1~deployments')).toBe(true)
  })

  test('returns undefined when resource or version mismatch', () => {
    const fn = namespacedByGvr([e('apps', 'v1', 'deployments', true)])

    expect(fn('apps~v2~deployments')).toBeUndefined()
    expect(fn('apps~v1~statefulsets')).toBeUndefined()
  })
})
