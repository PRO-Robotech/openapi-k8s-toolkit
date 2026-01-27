/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseLabelsArrayOfAny } from './parseLabelsArrayOfAny'

describe('parseLabelsArrayOfAny', () => {
  test('returns error when value is not an array', () => {
    expect(parseLabelsArrayOfAny(undefined as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(parseLabelsArrayOfAny(null as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(parseLabelsArrayOfAny({} as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(parseLabelsArrayOfAny('x' as any)).toEqual({ error: 'Value on jsonPath is not an array' })
  })

  test('returns data when first element is a record of string|number', () => {
    const value = [{ a: '1', b: 2 }] as any
    expect(parseLabelsArrayOfAny(value)).toEqual({ data: { a: '1', b: 2 } })
  })

  test('returns error when first element is not a record of string|number', () => {
    expect(parseLabelsArrayOfAny([{ a: true }] as any)).toEqual({ error: 'Value on jsonPath is not a record array' })
    expect(parseLabelsArrayOfAny([['a', 'b']] as any)).toEqual({ error: 'Value on jsonPath is not a record array' })
    expect(parseLabelsArrayOfAny([null] as any)).toEqual({ error: 'Value on jsonPath is not a record array' })
    expect(parseLabelsArrayOfAny([1] as any)).toEqual({ error: 'Value on jsonPath is not a record array' })
  })

  test('returns error for empty array', () => {
    expect(parseLabelsArrayOfAny([] as any)).toEqual({ error: 'Value on jsonPath is not a record array' })
  })

  test('allows empty object as valid record', () => {
    // Object.entries({}) => [] so guard passes
    expect(parseLabelsArrayOfAny([{}] as any)).toEqual({ data: {} })
  })
})
