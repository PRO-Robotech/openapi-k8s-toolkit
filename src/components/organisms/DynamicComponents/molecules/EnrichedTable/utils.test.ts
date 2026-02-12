/* eslint-disable max-classes-per-file */
import { isValidLabelSelectorObject } from './utils'

describe('isValidLabelSelectorObject', () => {
  test('returns true for plain object with string and number values', () => {
    expect(isValidLabelSelectorObject({ app: 'web', replicas: 2 })).toBe(true)
  })

  test('returns false for missing selector values', () => {
    expect(isValidLabelSelectorObject(undefined)).toBe(false)
    expect(isValidLabelSelectorObject(null)).toBe(false)
  })

  test('returns false for non-plain objects', () => {
    expect(isValidLabelSelectorObject([])).toBe(false)
    expect(isValidLabelSelectorObject('a=b')).toBe(false)
    expect(isValidLabelSelectorObject(123)).toBe(false)

    class X {
      a = 1
    }
    expect(isValidLabelSelectorObject(new X())).toBe(false)
  })

  test('returns false for empty plain object', () => {
    expect(isValidLabelSelectorObject({})).toBe(false)
  })

  test('returns false when any value is not string or number', () => {
    expect(isValidLabelSelectorObject({ app: true })).toBe(false)
    expect(isValidLabelSelectorObject({ app: 'web', meta: { nested: true } })).toBe(false)
    expect(isValidLabelSelectorObject({ app: 'web', count: null })).toBe(false)
  })
})
