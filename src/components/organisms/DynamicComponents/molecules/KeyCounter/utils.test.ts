/* eslint-disable @typescript-eslint/no-explicit-any */
import { getItemsInside } from './utils'

describe('getItemsInside', () => {
  test('returns error when value is not an array', () => {
    expect(getItemsInside(undefined as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getItemsInside(null as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getItemsInside({} as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getItemsInside('x' as any)).toEqual({ error: 'Value on jsonPath is not an array' })
  })

  test('returns counter 0 when first element is not an object', () => {
    expect(getItemsInside([1] as any)).toEqual({ counter: 0 })
    expect(getItemsInside(['x'] as any)).toEqual({ counter: 0 })
    expect(getItemsInside([true] as any)).toEqual({ counter: 0 })
  })

  test('returns counter 0 when first element is null', () => {
    expect(getItemsInside([null] as any)).toEqual({ counter: 0 })
  })

  test('returns counter 0 for empty array (value[0] is undefined)', () => {
    expect(getItemsInside([] as any)).toEqual({ counter: 0 })
  })

  test('counts keys of the first object', () => {
    expect(getItemsInside([{ a: 1, b: 2, c: 3 }] as any)).toEqual({ counter: 3 })
  })

  test('counts keys even if first "object" is an array', () => {
    // arrays are objects; Object.keys(['a','b']) => ['0','1']
    expect(getItemsInside([['a', 'b']] as any)).toEqual({ counter: 2 })
  })
})
