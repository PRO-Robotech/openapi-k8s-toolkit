/* eslint-disable @typescript-eslint/no-explicit-any */
import { unknownToString, parseArrayOfAny } from './utils'

describe('unknownToString', () => {
  test('returns "No value" for falsy values', () => {
    expect(unknownToString(undefined)).toBe('No value')
    expect(unknownToString(null)).toBe('No value')
    expect(unknownToString('')).toBe('No value')
    expect(unknownToString(0)).toBe('No value')
    expect(unknownToString(false)).toBe('No value')
  })

  test('stringifies objects', () => {
    expect(unknownToString({ a: 1 })).toBe('{"a":1}')
    expect(unknownToString([1, 2])).toBe('[1,2]')
  })

  test('uses toString for primitives', () => {
    expect(unknownToString('abc')).toBe('abc')
    expect(unknownToString(123)).toBe('123')
    expect(unknownToString(true)).toBe('true')
  })
})

describe('parseArrayOfAny', () => {
  test('returns error when value is not an array', () => {
    expect(parseArrayOfAny(undefined as any)).toEqual({ error: 'Value on jsonPath is not an array' })
  })

  test('flattens one level and returns data when result is record array', () => {
    const value = [[{ a: 1 }, { b: 2 }], [{ c: 3 }]] as any

    const res = parseArrayOfAny(value)

    expect(res.error).toBeUndefined()
    expect(res.data).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }])
  })

  test('returns error when flattened items are not all plain objects', () => {
    const value = [[{ a: 1 }], [2]] as any

    const res = parseArrayOfAny(value)

    expect(res).toEqual({ error: 'Value on jsonPath is not a record array' })
  })

  test('returns error when flattened includes arrays', () => {
    const value = [[{ a: 1 }], [[{ b: 2 }]]] as any

    const res = parseArrayOfAny(value)

    // Because isRecordArray excludes Array items
    expect(res).toEqual({ error: 'Value on jsonPath is not a record array' })
  })

  test('handles empty outer array', () => {
    const res = parseArrayOfAny([] as any)

    // flattenOnce([]) => []
    // isRecordArray([]) => true (every() on empty array)
    expect(res).toEqual({ data: [] })
  })

  test('handles inner empty arrays', () => {
    const res = parseArrayOfAny([[], []] as any)

    expect(res).toEqual({ data: [] })
  })
})
