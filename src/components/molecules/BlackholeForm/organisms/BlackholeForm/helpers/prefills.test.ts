/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash'
import {
  pathKey,
  toWildcardPath,
  collectArrayLengths,
  templateMatchesArray,
  buildConcretePathForNewItem,
  scrubLiteralWildcardKeys,
  type TTemplate,
} from './prefills'

// Silence debug output + allow branch calls without noise
jest.mock('./debugs', () => ({
  dbg: jest.fn(),
}))

describe('prefills helpers', () => {
  describe('pathKey', () => {
    test('stringifies path arrays', () => {
      expect(pathKey(['a', 0, 'b'])).toBe(JSON.stringify(['a', 0, 'b']))
    })
  })

  describe('toWildcardPath', () => {
    test('replaces numbers and numeric strings with "*"', () => {
      expect(toWildcardPath(['spec', 'containers', 0, 'image'])).toEqual(['spec', 'containers', '*', 'image'])
      expect(toWildcardPath(['spec', 'containers', '0', 'image'] as any)).toEqual(['spec', 'containers', '*', 'image'])
    })

    test('keeps non-numeric strings unchanged', () => {
      expect(toWildcardPath(['metadata', 'namespace'])).toEqual(['metadata', 'namespace'])
      expect(toWildcardPath(['a', '01x', 'b'] as any)).toEqual(['a', '01x', 'b'])
    })
  })

  describe('collectArrayLengths', () => {
    test('collects lengths for nested arrays with correct path keys', () => {
      const obj = {
        spec: {
          containers: [{ env: [{ a: 1 }, { a: 2 }] }, { env: [] }],
          numbers: [1, 2, 3],
        },
        plain: { x: 1 },
      }

      const map = collectArrayLengths(obj)

      // Top-level arrays
      expect(map.get(JSON.stringify(['spec', 'containers']))).toBe(2)
      expect(map.get(JSON.stringify(['spec', 'numbers']))).toBe(3)

      // Nested arrays
      expect(map.get(JSON.stringify(['spec', 'containers', 0, 'env']))).toBe(2)
      expect(map.get(JSON.stringify(['spec', 'containers', 1, 'env']))).toBe(0)
    })

    test('handles root array input', () => {
      const map = collectArrayLengths([{ a: [1, 2] }, { a: [] }])

      expect(map.get(JSON.stringify([]))).toBe(2)
      expect(map.get(JSON.stringify([0, 'a']))).toBe(2)
      expect(map.get(JSON.stringify([1, 'a']))).toBe(0)
    })

    test('ignores primitives safely', () => {
      const map = collectArrayLengths('hello' as any)
      expect(map.size).toBe(0)
    })
  })

  describe('templateMatchesArray', () => {
    const mk = (wildcardPath: (string | number)[]): TTemplate => ({
      wildcardPath,
      value: 'v',
    })

    test('returns false when template path is too short', () => {
      const tpl = mk(['spec'])
      expect(templateMatchesArray(tpl, ['spec', 'containers'])).toBe(false)
    })

    test('returns false on segment mismatch when not wildcard', () => {
      const tpl = mk(['spec', 'pods', '*'])
      expect(templateMatchesArray(tpl, ['spec', 'containers'])).toBe(false)
    })

    test('returns false when wildcard is not at the item position', () => {
      // arrayPath length = 2 => must have '*' at index 2
      const tpl = mk(['spec', 'containers', 'name'])
      expect(templateMatchesArray(tpl, ['spec', 'containers'])).toBe(false)
    })

    test('returns true when prefix matches and wildcard is at item position', () => {
      const tpl = mk(['spec', '*', '*', 'name'])
      expect(templateMatchesArray(tpl, ['spec', 'containers'])).toBe(true)
    })

    test('supports wildcard matching in the prefix', () => {
      const tpl = mk(['*', 'containers', '*'])
      expect(templateMatchesArray(tpl, ['spec', 'containers'])).toBe(true)
    })
  })

  describe('buildConcretePathForNewItem', () => {
    const mk = (wildcardPath: (string | number)[]): TTemplate => ({
      wildcardPath,
      value: 'v',
    })

    test('realizes wildcard prefix using arrayPath and injects newIndex', () => {
      const tpl = mk(['spec', '*', '*', 'name'])
      const arrayPath: (string | number)[] = ['spec', 'containers']

      expect(buildConcretePathForNewItem(tpl, arrayPath, 5)).toEqual(['spec', 'containers', 5, 'name'])
    })

    test('keeps concrete prefix segments over arrayPath when not wildcard', () => {
      const tpl = mk(['spec', 'containers', '*', 'image'])
      const arrayPath: (string | number)[] = ['spec', 'containers']

      expect(buildConcretePathForNewItem(tpl, arrayPath, 0)).toEqual(['spec', 'containers', 0, 'image'])
    })
  })

  describe('scrubLiteralWildcardKeys', () => {
    test('removes literal "*" keys recursively from objects', () => {
      const input = {
        a: 1,
        '*': 2,
        b: {
          '*': 3,
          c: 4,
          d: {
            '*': 9,
            e: 10,
          },
        },
        d: [{ '*': 5, e: 6 }, 7],
      }

      const res = scrubLiteralWildcardKeys(input)

      expect(res).toEqual({
        a: 1,
        b: {
          c: 4,
          d: {
            e: 10,
          },
        },
        d: [{ e: 6 }, 7],
      })
    })

    test('preserves arrays and primitive values', () => {
      expect(scrubLiteralWildcardKeys([1, { '*': 'x', ok: true }] as any)).toEqual([1, { ok: true }])
      expect(scrubLiteralWildcardKeys('hi' as any)).toBe('hi')
      expect(scrubLiteralWildcardKeys(123 as any)).toBe(123)
      expect(scrubLiteralWildcardKeys(null as any)).toBeNull()
    })

    test('does not mutate original input', () => {
      const input: any = { '*': 1, a: { '*': 2, b: 3 } }
      const clone = _.cloneDeep(input)

      const res = scrubLiteralWildcardKeys(input)

      expect(res).toEqual({ a: { b: 3 } })
      expect(input).toEqual(clone)
    })
  })
})
