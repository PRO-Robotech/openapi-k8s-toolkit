/* eslint-disable default-param-last */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSortedKinds } from './getSortedKinds'

/**
 * These tests use minimal runtime shapes that match what getSortedKinds reads:
 * - index.items: [{ group, kind, versions }]
 * - versions entries: { version?, groupVersion?, preferred? }
 *
 * We cast to any to avoid coupling tests to localTypes.
 */

const v = (version: string, preferred = false, extra?: Record<string, unknown>) =>
  ({
    version,
    preferred,
    resource: extra?.resource ?? 'things',
    ...extra,
  }) as any

const gv = (groupVersion: string, preferred = false, extra?: Record<string, unknown>) =>
  ({
    groupVersion,
    preferred,
    resource: extra?.resource ?? 'things',
    ...extra,
  }) as any

const item = (group: string, kind: string, versions: any[]) =>
  ({
    group,
    kind,
    versions,
  }) as any

describe('getSortedKinds', () => {
  test('picks preferred version when present', () => {
    const index = {
      items: [item('apps', 'Deployment', [v('v1', false), v('v1beta1', true), v('v1alpha1', false)])],
    } as any

    const rows = getSortedKinds(index)

    expect(rows).toHaveLength(1)
    expect(rows[0].kind).toBe('Deployment')
    expect(rows[0].group).toBe('apps')
    expect(rows[0].version.version).toBe('v1beta1')
  })

  test('when no preferred, picks best by k8s order (stable > beta > alpha)', () => {
    const index = {
      items: [item('apps', 'Widget', [v('v1beta1'), v('v1alpha1'), v('v1')])],
    } as any

    const rows = getSortedKinds(index)

    expect(rows).toHaveLength(1)
    expect(rows[0].version.version).toBe('v1') // stable wins
  })

  test('when no preferred, stageNum desc within same stage', () => {
    const index = {
      items: [item('apps', 'Widget', [v('v1beta1'), v('v1beta2'), v('v1beta10')])],
    } as any

    const rows = getSortedKinds(index)

    expect(rows).toHaveLength(1)
    expect(rows[0].version.version).toBe('v1beta10')
  })

  test('when no preferred, major desc within same stage/rank', () => {
    const index = {
      items: [item('apps', 'Widget', [v('v1beta2'), v('v2beta1'), v('v3beta1')])],
    } as any

    const rows = getSortedKinds(index)

    expect(rows[0].version.version).toBe('v3beta1')
  })

  test('stable beats beta even if beta has higher major (per comparator)', () => {
    const index = {
      items: [item('apps', 'Widget', [v('v2beta1'), v('v1')])],
    } as any

    const rows = getSortedKinds(index)

    expect(rows[0].version.version).toBe('v1')
  })

  test('uses groupVersion fallback when version is missing', () => {
    const index = {
      items: [item('apps', 'Deployment', [gv('apps/v1beta1'), gv('apps/v1')])],
    } as any

    const rows = getSortedKinds(index)

    expect(rows).toHaveLength(1)
    // stable v1 should be chosen
    expect(rows[0].version.groupVersion).toBe('apps/v1')
  })

  test('marks notUnique when same kind appears multiple times in index', () => {
    const index = {
      items: [item('g1', 'Thing', [v('v1')]), item('g2', 'Thing', [v('v1beta1')])],
    } as any

    const rows = getSortedKinds(index)

    expect(rows).toHaveLength(2)
    expect(rows.every(r => r.notUnique === true)).toBe(true)
  })

  test('filters out items with no versions (pickVersion undefined)', () => {
    const index = {
      items: [item('apps', 'HasVersion', [v('v1')]), item('apps', 'NoVersion', [])],
    } as any

    const rows = getSortedKinds(index)

    expect(rows).toHaveLength(1)
    expect(rows[0].kind).toBe('HasVersion')
  })

  test('sorts by kind then group alphabetically (case-insensitive)', () => {
    const index = {
      items: [
        item('zzz', 'betaKind', [v('v1')]),
        item('bbb', 'AlphaKind', [v('v1beta1')]),
        item('aaa', 'AlphaKind', [v('v1')]),
      ],
    } as any

    const rows = getSortedKinds(index)

    expect(rows.map(r => `${r.kind}:${r.group}:${r.version.version}`)).toEqual([
      'AlphaKind:aaa:v1',
      'AlphaKind:bbb:v1beta1',
      'betaKind:zzz:v1',
    ])
  })
})
