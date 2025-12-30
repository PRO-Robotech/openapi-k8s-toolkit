import { includesArray } from '../nestedStringsArrayInclude'

describe('includesArray', () => {
  test('returns false when matrix is undefined', () => {
    expect(includesArray(undefined, ['a'])).toBe(false)
  })

  test('returns true when a matching string row exists', () => {
    const matrix = [
      ['a', 'b'],
      ['c', 'd'],
    ]
    expect(includesArray(matrix, ['c', 'd'])).toBe(true)
  })

  test('returns false when no matching row exists', () => {
    const matrix = [
      ['a', 'b'],
      ['c', 'd'],
    ]
    expect(includesArray(matrix, ['a', 'c'])).toBe(false)
  })

  test('returns false when lengths differ', () => {
    const matrix = [['a', 'b']]
    expect(includesArray(matrix, ['a'])).toBe(false)
  })

  /**
   * NOTE:
   * The current implementation tries to support numbers in `target`,
   * but due to the second comparison `arr1[i] !== arr2[i]`,
   * numeric targets will not match string rows even when values are equivalent.
   *
   * This test documents current behavior and covers that branch.
   */
  test('does not match numeric target against string row (current behavior)', () => {
    const matrix = [['1', '2']]
    expect(includesArray(matrix, [1, 2])).toBe(false)
  })

  test('matches when target is stringified numbers', () => {
    const matrix = [['1', '2']]
    expect(includesArray(matrix, ['1', '2'])).toBe(true)
  })
})
