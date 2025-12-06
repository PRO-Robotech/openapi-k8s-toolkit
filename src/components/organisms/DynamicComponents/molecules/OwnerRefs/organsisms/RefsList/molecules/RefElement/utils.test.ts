/* eslint-disable @typescript-eslint/no-explicit-any */
import { findOwnerReferencePath, resolveFormPath } from './utils'
import type { TOwnerReference } from '../../../../types'

describe('findOwnerReferencePath', () => {
  const ref = (partial: Partial<TOwnerReference> = {}): TOwnerReference =>
    ({
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      name: 'my-deploy',
      ...partial,
    }) as any

  test('returns undefined when rawObject or jsonPathToArrayOfRefs is missing', () => {
    expect(findOwnerReferencePath(undefined as any, '.spec.customRef', ref())).toBeUndefined()
    expect(findOwnerReferencePath({} as any, '' as any, ref())).toBeUndefined()
  })

  test('normalizes jsonPath starting with "."', () => {
    const obj = {
      spec: {
        customRef: [
          { apiVersion: 'apps/v1', kind: 'Deployment', name: 'a' },
          { apiVersion: 'apps/v1', kind: 'Deployment', name: 'my-deploy' },
        ],
      },
    }

    const result = findOwnerReferencePath(obj, '.spec.customRef', ref())
    expect(result).toEqual(['spec', 'customRef', 1])
  })

  test('normalizes jsonPath starting with "$"', () => {
    const obj = {
      spec: {
        customRef: [{ apiVersion: 'apps/v1', kind: 'Deployment', name: 'my-deploy' }],
      },
    }

    const result = findOwnerReferencePath(obj, '$.spec.customRef', ref())
    expect(result).toEqual(['spec', 'customRef', 0])
  })

  test('strips trailing [*] from jsonPath', () => {
    const obj = {
      spec: {
        customRef: [{ apiVersion: 'apps/v1', kind: 'Deployment', name: 'my-deploy' }],
      },
    }

    const result = findOwnerReferencePath(obj, '.spec.customRef[*]', ref())
    expect(result).toEqual(['spec', 'customRef', 0])
  })

  test('throws for jsonPath without leading "." or "$" (current implementation behavior)', () => {
    const obj = {
      spec: {
        customRef: [
          { apiVersion: 'apps/v1', kind: 'Deployment', name: 'x' },
          { apiVersion: 'apps/v1', kind: 'Deployment', name: 'my-deploy' },
        ],
      },
    }

    // The implementation currently normalizes "spec.customRef" to "$spec.customRef"
    // which is invalid JSONPath and will throw inside jp.nodes.
    expect(() => findOwnerReferencePath(obj, 'spec.customRef', ref())).toThrow()
  })

  test('returns undefined when jsonpath node not found', () => {
    const obj = { spec: {} }
    const result = findOwnerReferencePath(obj, '.spec.customRef', ref())
    expect(result).toBeUndefined()
  })

  test('returns undefined when node value is not an array', () => {
    const obj = { spec: { customRef: { not: 'array' } } }
    const result = findOwnerReferencePath(obj, '.spec.customRef', ref())
    expect(result).toBeUndefined()
  })

  test('returns undefined when reference is not in array', () => {
    const obj = {
      spec: {
        customRef: [{ apiVersion: 'apps/v1', kind: 'Deployment', name: 'other' }],
      },
    }

    const result = findOwnerReferencePath(obj, '.spec.customRef', ref())
    expect(result).toBeUndefined()
  })

  test('matches strictly by name, kind, apiVersion', () => {
    const obj = {
      spec: {
        customRef: [
          { apiVersion: 'apps/v1', kind: 'Deployment', name: 'my-deploy' },
          { apiVersion: 'apps/v1', kind: 'StatefulSet', name: 'my-deploy' },
          { apiVersion: 'v1', kind: 'Deployment', name: 'my-deploy' },
        ],
      },
    }

    expect(findOwnerReferencePath(obj, '.spec.customRef', ref())).toEqual(['spec', 'customRef', 0])
    expect(findOwnerReferencePath(obj, '.spec.customRef', ref({ kind: 'StatefulSet' }))).toEqual([
      'spec',
      'customRef',
      1,
    ])
    expect(findOwnerReferencePath(obj, '.spec.customRef', ref({ apiVersion: 'v1' }))).toEqual(['spec', 'customRef', 2])
  })
})

describe('resolveFormPath', () => {
  test('returns [] when pathInput is undefined/empty', () => {
    expect(resolveFormPath(undefined, ['spec'])).toEqual([])
    expect(resolveFormPath('' as any, ['spec'])).toEqual([])
  })

  test('returns array as-is when pathInput is already an array', () => {
    expect(resolveFormPath(['spec', 'hosts', 0] as any, ['x'])).toEqual(['spec', 'hosts', 0])
  })

  test('parses absolute dot path', () => {
    expect(resolveFormPath('spec.hosts.0.namespace', ['x'])).toEqual(['spec', 'hosts', 0, 'namespace'])
  })

  test('treats non-relative string without leading ./ or ../ as absolute', () => {
    expect(resolveFormPath('metadata.name', ['spec', 'x'])).toEqual(['metadata', 'name'])
  })

  test('resolves simple relative "./"', () => {
    expect(resolveFormPath('./namespace', ['spec', 'hosts', 0])).toEqual(['spec', 'hosts', 0, 'namespace'])
  })

  test('resolves parent relative "../"', () => {
    expect(resolveFormPath('../name', ['spec', 'hosts', 0, 'namespace'])).toEqual(['spec', 'hosts', 0, 'name'])
  })

  test('resolves multi-step relative path', () => {
    expect(resolveFormPath('../../foo.bar.1', ['spec', 'hosts', 0, 'namespace'])).toEqual([
      'spec',
      'hosts',
      'foo',
      'bar',
      1,
    ])
  })

  test('handles redundant "." segments', () => {
    expect(resolveFormPath('././a', ['x'])).toEqual(['x', 'a'])
  })
})
