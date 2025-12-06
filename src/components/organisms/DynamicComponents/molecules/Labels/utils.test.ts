/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseArrayOfAny, truncate } from './utils'

describe('parseArrayOfAny', () => {
  test('returns error when value is not an array', () => {
    expect(parseArrayOfAny(undefined as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(parseArrayOfAny(null as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(parseArrayOfAny({} as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(parseArrayOfAny('x' as any)).toEqual({ error: 'Value on jsonPath is not an array' })
  })

  test('returns data when first element is a record of string|number', () => {
    const value = [{ a: '1', b: 2 }] as any
    expect(parseArrayOfAny(value)).toEqual({ data: { a: '1', b: 2 } })
  })

  test('returns error when first element is not a record of string|number', () => {
    expect(parseArrayOfAny([{ a: true }] as any)).toEqual({ error: 'Value on jsonPath is not a record array' })
    expect(parseArrayOfAny([['a', 'b']] as any)).toEqual({ error: 'Value on jsonPath is not a record array' })
    expect(parseArrayOfAny([null] as any)).toEqual({ error: 'Value on jsonPath is not a record array' })
    expect(parseArrayOfAny([1] as any)).toEqual({ error: 'Value on jsonPath is not a record array' })
  })

  test('returns error for empty array', () => {
    expect(parseArrayOfAny([] as any)).toEqual({ error: 'Value on jsonPath is not a record array' })
  })

  test('allows empty object as valid record', () => {
    // Object.entries({}) => [] so guard passes
    expect(parseArrayOfAny([{}] as any)).toEqual({ data: {} })
  })
})

describe('truncate', () => {
  test('returns original text when max is undefined', () => {
    expect(truncate('hello')).toBe('hello')
  })

  test('returns original text when max is 0 (falsy)', () => {
    expect(truncate('hello', 0)).toBe('hello')
  })

  test('does not truncate when text length <= max', () => {
    expect(truncate('hello', 5)).toBe('hello')
    expect(truncate('hello', 10)).toBe('hello')
  })

  test('truncates and appends ellipsis when text length > max', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
    expect(truncate('abcdef', 3)).toBe('abc...')
  })
})
