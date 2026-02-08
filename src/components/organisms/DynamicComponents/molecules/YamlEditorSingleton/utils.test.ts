/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDataByPath, getPrefillValuesWithForces } from './utils'

describe('getDataByPath', () => {
  test('gets data by lodash path array', () => {
    const prefillValuesRaw = {
      spec: {
        replicas: 3,
      },
    }

    const res = getDataByPath({
      prefillValuesRaw,
      pathToData: ['spec', 'replicas'],
    })

    expect(res).toBe(3)
  })

  test('gets data by jsonpath string (expects dot-prefixed path)', () => {
    const prefillValuesRaw = {
      metadata: {
        name: 'demo',
      },
    }

    const res = getDataByPath({
      prefillValuesRaw,
      pathToData: '.metadata.name',
    })

    expect(res).toBe('demo')
  })

  test('returns undefined for missing array path', () => {
    const prefillValuesRaw = {
      spec: {},
    }

    const res = getDataByPath({
      prefillValuesRaw,
      pathToData: ['spec', 'missing'],
    })

    expect(res).toBeUndefined()
  })

  test('returns undefined when prefillValuesRaw is nullish', () => {
    const res = getDataByPath({
      prefillValuesRaw: undefined,
      pathToData: ['spec', 'replicas'],
    })

    expect(res).toBeUndefined()
  })
})

describe('getPrefillValuesWithForces', () => {
  test('moves kind and apiVersion to the top when forcedKind is not provided', () => {
    const prefillValues = { a: 1, kind: 'Old', b: 2, apiVersion: 'old/v1' }

    const res = getPrefillValuesWithForces({
      prefillValues,
      forcedKind: undefined,
      apiGroup: 'apps',
      apiVersion: 'v1',
    })

    expect(res).toEqual({
      kind: 'Old',
      apiVersion: 'old/v1',
      a: 1,
      b: 2,
    })
    expect(Object.keys(res)).toEqual(['kind', 'apiVersion', 'a', 'b'])
  })

  test('overwrites kind and apiVersion and preserves other fields', () => {
    const prefillValues = {
      kind: 'OldKind',
      apiVersion: 'old/v1',
      metadata: { name: 'x' },
      spec: { replicas: 2 },
    }

    const res = getPrefillValuesWithForces({
      prefillValues,
      forcedKind: 'Deployment',
      apiGroup: 'apps',
      apiVersion: 'v1',
    })

    expect(res).toEqual({
      kind: 'Deployment',
      apiVersion: 'apps/v1',
      metadata: { name: 'x' },
      spec: { replicas: 2 },
    })
  })

  test('builds apiVersion without apiGroup when apiGroup is not provided', () => {
    const prefillValues = { metadata: { name: 'x' } }

    const res = getPrefillValuesWithForces({
      prefillValues,
      forcedKind: 'Pod',
      apiVersion: 'v1',
      apiGroup: undefined,
    })

    expect(res).toEqual({
      kind: 'Pod',
      apiVersion: 'v1',
      metadata: { name: 'x' },
    })
  })

  test('handles prefillValues without existing kind/apiVersion', () => {
    const prefillValues = { foo: 'bar' }

    const res = getPrefillValuesWithForces({
      prefillValues,
      forcedKind: 'Service',
      apiGroup: '',
      apiVersion: 'v1',
    })

    expect(res).toEqual({
      kind: 'Service',
      apiVersion: 'v1',
      foo: 'bar',
    })
  })

  test('does not add apiVersion when forcedKind exists but apiVersion is missing', () => {
    const prefillValues = { apiVersion: 'old/v1', foo: 'bar' }

    const res = getPrefillValuesWithForces({
      prefillValues,
      forcedKind: 'Service',
      apiGroup: 'apps',
      apiVersion: undefined,
    })

    expect(res).toEqual({
      kind: 'Service',
      foo: 'bar',
    })
    expect(Object.keys(res)).toEqual(['kind', 'foo'])
  })
})
