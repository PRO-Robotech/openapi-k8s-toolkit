/* eslint-disable @typescript-eslint/no-explicit-any */
import { sanitizeWildcardPath, expandWildcardTemplates, toStringPath, isPrefix } from './hiddenExpanded'

// Silence debug noise + keep prettyPath stable for internal calls
jest.mock('./debugs', () => ({
  wdbg: jest.fn(),
  wgroup: jest.fn(),
  wend: jest.fn(),
  prettyPath: (p: any) => (Array.isArray(p) ? p.map((x: any) => String(x)).join('.') : String(p)),
}))

describe('hiddenExpanded helpers', () => {
  describe('sanitizeWildcardPath', () => {
    test('keeps literal "*" and converts numbers/numeric strings/unknown to "*"', () => {
      const input: any[] = ['spec', 0, 'containers', '1', '*', { a: 1 }, null, undefined, 'name']
      const res = sanitizeWildcardPath(input)

      expect(res).toEqual(['spec', '*', 'containers', '*', '*', '*', '*', '*', 'name'])
    })

    test('keeps non-numeric strings as-is', () => {
      const res = sanitizeWildcardPath(['metadata', 'namespace', 'prod'])
      expect(res).toEqual(['metadata', 'namespace', 'prod'])
    })
  })

  describe('expandWildcardTemplates', () => {
    const values = {
      spec: {
        containers: [{ name: 'c1', env: [{ key: 'A' }, { key: 'B' }] }, { name: 'c2' }],
        labels: {
          app: 'x',
          tier: 'y',
        },
      },
    }

    test('expands wildcard over array indices', () => {
      const templates = [['spec', 'containers', '*', 'name']]

      const res = expandWildcardTemplates(templates as any, values as any)

      expect(res).toEqual([
        ['spec', 'containers', 0, 'name'],
        ['spec', 'containers', 1, 'name'],
      ])
    })

    test('expands wildcard over object keys', () => {
      const templates = [['spec', 'labels', '*']]

      const res = expandWildcardTemplates(templates as any, values as any)

      expect(res).toEqual([
        ['spec', 'labels', 'app'],
        ['spec', 'labels', 'tier'],
      ])
    })

    test('wildcard dead-end produces no hits', () => {
      const templates = [['spec', 'missing', '*']]

      const res = expandWildcardTemplates(templates as any, values as any)

      expect(res).toEqual([])
    })

    test('concrete object path descends and hits when present', () => {
      const templates = [['spec', 'containers', '*', 'env']]

      const res = expandWildcardTemplates(templates as any, values as any)

      // env exists only on index 0
      expect(res).toEqual([['spec', 'containers', 0, 'env']])
    })

    test('concrete array index segment descends', () => {
      const templates = [['spec', 'containers', 0, 'name']]

      const res = expandWildcardTemplates(templates as any, values as any)

      expect(res).toEqual([['spec', 'containers', 0, 'name']])
    })

    test('concrete array index out of range yields no hits', () => {
      const templates = [['spec', 'containers', 99, 'name']]

      const res = expandWildcardTemplates(templates as any, values as any)

      expect(res).toEqual([])
    })

    test('includeMissingExact adds exact path when no wildcard and no hits', () => {
      const templates = [['spec', 'doesNotExist']]

      const res = expandWildcardTemplates(templates as any, values as any, {
        includeMissingExact: true,
      })

      expect(res).toEqual([['spec', 'doesNotExist']])
    })

    test('includeMissingExact does NOT add templates that contain "*"', () => {
      const templates = [['spec', 'containers', '*', 'doesNotExist']]

      const res = expandWildcardTemplates(templates as any, values as any, {
        includeMissingExact: true,
      })

      expect(res).toEqual([])
    })

    test('includeMissingFinalForWildcard allows missing last segment when template contains wildcard', () => {
      const templates = [['spec', 'containers', '*', 'image']]

      const res = expandWildcardTemplates(templates as any, values as any, {
        includeMissingFinalForWildcard: true,
      })

      expect(res).toEqual([
        ['spec', 'containers', 0, 'image'],
        ['spec', 'containers', 1, 'image'],
      ])
    })

    test('without includeMissingFinalForWildcard, missing final segment is not included', () => {
      const templates = [['spec', 'containers', '*', 'image']]

      const res = expandWildcardTemplates(templates as any, values as any)

      expect(res).toEqual([])
    })

    test('dedupes identical paths across templates', () => {
      const templates = [
        ['spec', 'containers', '*', 'name'],
        ['spec', 'containers', '*', 'name'], // duplicate template
        ['spec', 'containers', 0, 'name'], // overlaps with wildcard hit
      ]

      const res = expandWildcardTemplates(templates as any, values as any)

      expect(res).toEqual([
        ['spec', 'containers', 0, 'name'],
        ['spec', 'containers', 1, 'name'],
      ])
    })
  })

  describe('toStringPath', () => {
    test('converts array path to string segments', () => {
      const res = toStringPath(['a', 0, 'b'] as any)
      expect(res).toEqual(['a', '0', 'b'])
    })

    test('wraps non-array path into array', () => {
      const res = toStringPath('spec' as any)
      expect(res).toEqual(['spec'])
    })
  })

  describe('isPrefix', () => {
    test('true when prefix matches start of full', () => {
      expect(isPrefix(['a', 'b', 'c'], ['a', 'b'])).toBe(true)
    })

    test('false when prefix longer than full', () => {
      expect(isPrefix(['a'], ['a', 'b'])).toBe(false)
    })

    test('false when any segment differs', () => {
      expect(isPrefix(['a', 'x', 'c'], ['a', 'b'])).toBe(false)
    })

    test('true when prefix equals full', () => {
      expect(isPrefix(['a', 0, 'b'], ['a', 0, 'b'])).toBe(true)
    })
  })
})
