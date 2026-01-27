/* eslint-disable @typescript-eslint/no-explicit-any */
import { getKeyCounterItemsInside } from './getKeyCounterItemsInside'

describe('getKeyCounterItemsInside', () => {
  test('returns error when value is not an array', () => {
    expect(getKeyCounterItemsInside(undefined as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getKeyCounterItemsInside(null as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getKeyCounterItemsInside({} as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getKeyCounterItemsInside('x' as any)).toEqual({ error: 'Value on jsonPath is not an array' })
  })

  test('returns counter 0 when first element is not an object', () => {
    expect(getKeyCounterItemsInside([1] as any)).toEqual({ counter: 0 })
    expect(getKeyCounterItemsInside(['x'] as any)).toEqual({ counter: 0 })
    expect(getKeyCounterItemsInside([true] as any)).toEqual({ counter: 0 })
  })

  test('returns counter 0 when first element is null', () => {
    expect(getKeyCounterItemsInside([null] as any)).toEqual({ counter: 0 })
  })

  test('returns counter 0 for empty array (value[0] is undefined)', () => {
    expect(getKeyCounterItemsInside([] as any)).toEqual({ counter: 0 })
  })

  test('counts keys of the first object', () => {
    expect(getKeyCounterItemsInside([{ a: 1, b: 2, c: 3 }] as any)).toEqual({ counter: 3 })
  })

  test('counts keys even if first "object" is an array', () => {
    // arrays are objects; Object.keys(['a','b']) => ['0','1']
    expect(getKeyCounterItemsInside([['a', 'b']] as any)).toEqual({ counter: 2 })
  })
})
