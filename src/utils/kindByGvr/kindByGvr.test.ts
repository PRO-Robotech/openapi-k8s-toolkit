/* eslint-disable @typescript-eslint/no-explicit-any */
import { kindByGvr } from './kindByGvr'

// Minimal builder matching the fields used by kindByGvr
const e = (kind: string, group: string, version: string, resource: string) =>
  ({
    kind,
    group,
    version: {
      version,
      resource,
    },
  }) as any

describe('kindByGvr', () => {
  test('returns undefined when no entries match', () => {
    const fn = kindByGvr([e('Deployment', 'apps', 'v1', 'deployments')])
    expect(fn('batch~v1~jobs')).toBeUndefined()
  })

  test('returns kind when exactly one unique kind exists', () => {
    const fn = kindByGvr([
      e('Deployment', 'apps', 'v1', 'deployments'),
      e('Deployment', 'apps', 'v1', 'deployments'), // duplicate ok
    ])

    expect(fn('apps~v1~deployments')).toBe('Deployment')
  })

  test('returns undefined when matching entries disagree on kind', () => {
    const fn = kindByGvr([
      e('Deployment', 'apps', 'v1', 'deployments'),
      e('FooDeployment', 'apps', 'v1', 'deployments'),
    ])

    expect(fn('apps~v1~deployments')).toBeUndefined()
  })

  test('supports core group with empty group prefix in gvr', () => {
    const fn = kindByGvr([e('Pod', '', 'v1', 'pods')])

    expect(fn('~v1~pods')).toBe('Pod')
  })

  test('trims group input for matching', () => {
    const fn = kindByGvr([e('Deployment', 'apps', 'v1', 'deployments')])

    expect(fn('  apps  ~v1~deployments')).toBe('Deployment')
  })

  test('returns undefined when resource or version mismatch', () => {
    const fn = kindByGvr([e('Deployment', 'apps', 'v1', 'deployments')])

    expect(fn('apps~v2~deployments')).toBeUndefined()
    expect(fn('apps~v1~statefulsets')).toBeUndefined()
  })
})
