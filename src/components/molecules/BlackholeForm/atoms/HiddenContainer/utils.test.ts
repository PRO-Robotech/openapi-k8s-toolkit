/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TFormName } from 'localTypes/form'
import { includesPath, toArray } from './utils'

describe('includesPath', () => {
  test('returns true when exact string path exists', () => {
    const haystack = [
      ['a', 'b'],
      ['x', 'y'],
    ]

    expect(includesPath(haystack, ['a', 'b'])).toBe(true)
    expect(includesPath(haystack, ['x', 'y'])).toBe(true)
  })

  test('returns false when length differs', () => {
    const haystack = [['a', 'b']]

    expect(includesPath(haystack, ['a'])).toBe(false)
    expect(includesPath(haystack, ['a', 'b', 'c'])).toBe(false)
  })

  test('compares by stringifying needle segments (numbers supported)', () => {
    const haystack = [
      ['items', '0', 'name'],
      ['items', '1', 'name'],
    ]

    expect(includesPath(haystack, ['items', 0, 'name'])).toBe(true)
    expect(includesPath(haystack, ['items', 1, 'name'])).toBe(true)
    expect(includesPath(haystack, ['items', 2, 'name'])).toBe(false)
  })

  test('fails when any segment does not match', () => {
    const haystack = [['a', 'b']]

    expect(includesPath(haystack, ['a', 'c'])).toBe(false)
    expect(includesPath(haystack, ['A', 'b'])).toBe(false)
  })

  test('works with empty paths', () => {
    const haystack = [[]]

    expect(includesPath(haystack, [])).toBe(true)
    expect(includesPath([], [])).toBe(false)
  })
})

describe('toArray', () => {
  test('returns undefined when input is undefined', () => {
    expect(toArray(undefined)).toBeUndefined()
  })

  test('wraps non-array values into array', () => {
    expect(toArray('a' as TFormName)).toEqual(['a'])
    expect(toArray(0 as TFormName)).toEqual([0])
    expect(toArray(123 as TFormName)).toEqual([123])
  })

  test('returns the same array instance when already an array', () => {
    const arr = ['a', 1, 'b'] as any as TFormName
    const res = toArray(arr)

    expect(res).toBe(arr as any)
    expect(res).toEqual(['a', 1, 'b'])
  })

  test('does not transform contents', () => {
    const value = ['x', 0, 'y'] as any as TFormName
    expect(toArray(value)).toEqual(['x', 0, 'y'])
  })
})
