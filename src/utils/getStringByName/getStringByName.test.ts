/* eslint-disable @typescript-eslint/no-explicit-any */
import { getStringByName } from './getStringByName'

describe('getStringByName', () => {
  test('returns string as-is', () => {
    expect(getStringByName('simple' as any)).toBe('simple')
    expect(getStringByName('Form A' as any)).toBe('Form A')
  })

  test('for array, returns the last element as string', () => {
    expect(getStringByName(['a', 'b', 'c'] as any)).toBe('c')
    expect(getStringByName([1, 2, 3] as any)).toBe('3')
    expect(getStringByName(['x', 42] as any)).toBe('42')
  })

  test('for array with single element', () => {
    expect(getStringByName(['only'] as any)).toBe('only')
    expect(getStringByName([7] as any)).toBe('7')
  })

  test('for number, returns stringified number', () => {
    expect(getStringByName(0 as any)).toBe('0')
    expect(getStringByName(123 as any)).toBe('123')
  })

  /**
   * Optional: document current behavior for empty array.
   * slice(-1)[0] will be undefined -> String(undefined) === "undefined"
   */
  test('empty array returns "undefined" (current behavior)', () => {
    expect(getStringByName([] as any)).toBe('undefined')
  })
})
