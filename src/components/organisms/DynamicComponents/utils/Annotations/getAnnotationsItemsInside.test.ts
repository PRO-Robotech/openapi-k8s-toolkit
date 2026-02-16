/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAnnotationsItemsInside } from './getAnnotationsItemsInside'

describe('getAnnotationsItemsInside', () => {
  test('returns error when value is not an array', () => {
    const res = getAnnotationsItemsInside(undefined as any)

    expect(res).toEqual({ error: 'Value on jsonPath is not an array' })
  })

  test('returns counter 0 when first element is not an object', () => {
    const res1 = getAnnotationsItemsInside([1] as any)
    const res2 = getAnnotationsItemsInside(['x'] as any)
    const res3 = getAnnotationsItemsInside([null] as any)

    expect(res1.counter).toBe(0)
    expect(res1.annotations).toBeUndefined()

    expect(res2.counter).toBe(0)
    expect(res2.annotations).toBeUndefined()

    expect(res3.counter).toBe(0)
    expect(res3.annotations).toBeUndefined()
  })

  test('returns annotations when first element is a string record (even if not object branch)', () => {
    const res = getAnnotationsItemsInside([{ a: '1', b: '2' }] as any)

    expect(res.counter).toBe(2)
    expect(res.annotations).toEqual({ a: '1', b: '2' })
  })

  test('does not set annotations when record values are not all strings', () => {
    const res = getAnnotationsItemsInside([{ a: '1', b: 2 }] as any)

    expect(res.counter).toBe(2)
    expect(res.annotations).toBeUndefined()
  })

  test('handles empty array safely (value[0] is undefined)', () => {
    const res = getAnnotationsItemsInside([] as any)

    // typeof undefined !== 'object' => first branch
    expect(res.counter).toBe(0)
    expect(res.annotations).toBeUndefined()
  })

  test('counts keys of first object even if it is not a plain object', () => {
    class X {
      a = '1'
      b = '2'
    }

    const res = getAnnotationsItemsInside([new X()] as any)

    expect(res.counter).toBe(2)
    // annotations requires plain object with string values, so should be undefined
    expect(res.annotations).toBeUndefined()
  })
})
