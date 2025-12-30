/* eslint-disable @typescript-eslint/no-explicit-any */
import { pluralByKind } from './pluralByKind'

// Minimal shape that matches what pluralByKind uses.
// If your real TKindWithVersion has extra fields, that's fine.
const e = (kind: string, apiGroup: string, ver: string, resource: string, preferred = false) =>
  ({
    kind,
    group: apiGroup,
    version: {
      version: ver,
      resource,
      preferred,
    },
  }) as any

describe('pluralByKind', () => {
  test('returns undefined when no candidates', () => {
    const fn = pluralByKind([])
    expect(fn('Pod')).toBeUndefined()
  })

  test('matches kind with trimming', () => {
    const fn = pluralByKind([e(' Pod ', '', 'v1', 'pods', true)])
    expect(fn('Pod')).toBe('pods')
  })

  test('apiVersion core form "v1" filters group=""', () => {
    const fn = pluralByKind([
      e('Deployment', 'apps', 'v1', 'deployments'),
      e('Deployment', '', 'v1', 'deployments.core'),
    ])

    expect(fn('Deployment', 'v1')).toBe('deployments.core')
  })

  test('apiVersion group/version filters correctly', () => {
    const fn = pluralByKind([
      e('Deployment', 'apps', 'v1', 'deployments.apps'),
      e('Deployment', 'extensions', 'v1beta1', 'deployments.ext'),
    ])

    expect(fn('Deployment', 'apps/v1')).toBe('deployments.apps')
    expect(fn('Deployment', 'extensions/v1beta1')).toBe('deployments.ext')
  })

  test('returns undefined when apiVersion specified but no match', () => {
    const fn = pluralByKind([e('Deployment', 'apps', 'v1', 'deployments')])
    expect(fn('Deployment', 'apps/v2')).toBeUndefined()
  })

  test('when apiVersion specified and multiple distinct resources match, returns undefined', () => {
    // Same kind/group/version but different resource names -> ambiguous
    const fn = pluralByKind([e('Thing', 'apps', 'v1', 'thingsA'), e('Thing', 'apps', 'v1', 'thingsB')])

    expect(fn('Thing', 'apps/v1')).toBeUndefined()
  })

  test('when apiVersion omitted, prefers preferred=true entry', () => {
    const fn = pluralByKind([
      e('Deployment', 'apps', 'v1beta1', 'deployments-beta', false),
      e('Deployment', 'apps', 'v1', 'deployments', true),
    ])

    expect(fn('Deployment')).toBe('deployments')
  })

  test('when apiVersion omitted and multiple resources exist, returns first preferredFirst resource', () => {
    const fn = pluralByKind([e('Widget', 'g1', 'v1', 'widgets-v1', true), e('Widget', 'g1', 'v2', 'widgets-v2', false)])

    // uniq would be > 1, so function returns preferredFirst[0].resource
    expect(fn('Widget')).toBe('widgets-v1')
  })

  test('when apiVersion omitted and no preferred flags, returns first candidate resource', () => {
    const fn = pluralByKind([
      e('Gadget', 'g1', 'v1', 'gadgets-v1', false),
      e('Gadget', 'g1', 'v2', 'gadgets-v2', false),
    ])

    expect(fn('Gadget')).toBe('gadgets-v1')
  })

  test('when apiVersion omitted and all resources same, returns that resource', () => {
    const fn = pluralByKind([e('Same', 'g1', 'v1', 'sames', true), e('Same', 'g1', 'v2', 'sames', false)])

    expect(fn('Same')).toBe('sames')
  })

  test('returns undefined if preferredFirst[0] has no resource (defensive)', () => {
    const entries = [
      {
        kind: 'Odd',
        group: 'g1',
        version: { version: 'v1', preferred: true, resource: '' },
      },
      {
        kind: 'Odd',
        group: 'g1',
        version: { version: 'v2', preferred: false, resource: '' },
      },
    ] as any

    const fn = pluralByKind(entries)
    expect(fn('Odd')).toBeUndefined()
  })

  test('trims apiVersion input', () => {
    const fn = pluralByKind([e('Deployment', 'apps', 'v1', 'deployments')])
    expect(fn('Deployment', '  apps/v1  ')).toBe('deployments')
  })
})
