/* eslint-disable @typescript-eslint/no-explicit-any */
import { isFlatObject } from './isFlatObject'

describe('isFlatObject', () => {
  test('returns true for empty object', () => {
    expect(isFlatObject({})).toBe(true)
  })

  test('returns true for primitives and null values', () => {
    expect(
      isFlatObject({
        a: 1,
        b: 'x',
        c: false,
        d: undefined,
        e: null,
      } as any),
    ).toBe(true)
  })

  test('returns false when a nested object exists', () => {
    expect(
      isFlatObject({
        a: 1,
        b: { x: 1 },
      } as any),
    ).toBe(false)
  })

  test('returns false for arrays (arrays are objects)', () => {
    expect(
      isFlatObject({
        a: [1, 2, 3],
      } as any),
    ).toBe(false)
  })

  test('returns false for Date instances', () => {
    expect(
      isFlatObject({
        a: new Date(),
      } as any),
    ).toBe(false)
  })
})
