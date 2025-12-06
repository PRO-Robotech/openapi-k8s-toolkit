/* eslint-disable default-param-last */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSortedKindsAll } from './getSortedKindsAll'

/**
 * These tests use minimal runtime shapes that match what getSortedKindsAll reads:
 * - index.items: [{ group, kind, versions }]
 * - versions entries: { version?, groupVersion?, preferred?, resource?, namespaced? ... }
 *
 * We cast to any to avoid depending on localTypes in unit tests.
 */

const v = (version: string | undefined, preferred = false, extra?: Record<string, unknown>) =>
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

describe('getSortedKindsAll', () => {
  test('returns one row per version', () => {
    const index = {
      items: [item('apps', 'Deployment', [v('v1'), v('v1beta1')])],
    } as any

    const rows = getSortedKindsAll(index)

    expect(rows).toHaveLength(2)
    expect(rows.map(r => r.version.version)).toEqual(['v1', 'v1beta1'])
  })

  test('preferred version is first for a given {group, kind}, rest sorted by k8s order', () => {
    const versions = [
      v('v1', false),
      v('v1beta1', true), // preferred even though stable exists
      v('v1alpha1', false),
    ]

    const index = {
      items: [item('apps', 'Deployment', versions)],
    } as any

    const rows = getSortedKindsAll(index)

    // preferred first no matter what
    expect(rows[0].version.version).toBe('v1beta1')

    // rest sorted: stable > beta > alpha (with same major)
    expect(rows.slice(1).map(r => r.version.version)).toEqual(['v1', 'v1alpha1'])
  })

  test('when no preferred, sorts stable > beta > alpha, then major desc, then stageNum desc', () => {
    const index = {
      items: [item('apps', 'Widget', [v('v1beta1'), v('v2beta1'), v('v1beta2'), v('v3alpha1'), v('v2')])],
    } as any

    const rows = getSortedKindsAll(index)

    // Expected order:
    // stable first: v2 (rank 3, major 2)
    // then betas: v2beta1 (major 2) > v1beta2 (stageNum 2) > v1beta1
    // then alphas: v3alpha1
    expect(rows.map(r => r.version.version)).toEqual(['v2', 'v2beta1', 'v1beta2', 'v1beta1', 'v3alpha1'])
  })

  test('uses groupVersion fallback when version is missing', () => {
    const index = {
      items: [item('apps', 'Deployment', [gv('apps/v1beta1'), gv('apps/v1')])],
    } as any

    const rows = getSortedKindsAll(index)

    // stable v1 should come before beta
    expect(rows.map(r => r.version.groupVersion ?? r.version.version)).toEqual(['apps/v1', 'apps/v1beta1'])

    // And the derived version tokens should be preserved in the cloned version object
    expect(rows[0].version.groupVersion).toBe('apps/v1')
    expect(rows[1].version.groupVersion).toBe('apps/v1beta1')
  })

  test('marks notUnique when the same kind appears in multiple index items (even across groups)', () => {
    const index = {
      items: [item('g1', 'Thing', [v('v1')]), item('g2', 'Thing', [v('v1beta1')])],
    } as any

    const rows = getSortedKindsAll(index)

    expect(rows).toHaveLength(2)
    expect(rows.every(r => r.notUnique === true)).toBe(true)
  })

  test('sorts by kind then group alphabetically (case-insensitive)', () => {
    const index = {
      items: [
        item('zzz', 'betaKind', [v('v1')]),
        item('aaa', 'AlphaKind', [v('v1')]),
        item('bbb', 'AlphaKind', [v('v1beta1')]),
      ],
    } as any

    const rows = getSortedKindsAll(index)

    // Order by kind: AlphaKind first, then betaKind
    // Within AlphaKind, group order: aaa then bbb
    expect(rows.map(r => `${r.kind}:${r.group}:${r.version.version}`)).toEqual([
      'AlphaKind:aaa:v1',
      'AlphaKind:bbb:v1beta1',
      'betaKind:zzz:v1',
    ])
  })

  test('does not mutate original versions array and clones version objects', () => {
    const versions = [v('v1beta1'), v('v1')]
    const originalOrder = versions.map(x => x.version)

    const index = {
      items: [item('apps', 'Deployment', versions)],
    } as any

    const rows = getSortedKindsAll(index)

    // input array order unchanged
    expect(versions.map(x => x.version)).toEqual(originalOrder)

    // returned versions are cloned (not same references)
    expect(rows[0].version).not.toBe(versions[0])
    expect(rows[1].version).not.toBe(versions[1])
  })
})
