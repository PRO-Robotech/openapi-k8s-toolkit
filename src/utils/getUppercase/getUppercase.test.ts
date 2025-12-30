import { getUppercase } from './getUppercase'

describe('getUppercase', () => {
  test('returns all existing uppercase letters in the string', () => {
    expect(getUppercase('abCD12Ef')).toBe('CDE')
    expect(getUppercase('HelloWorld')).toBe('HW')
  })

  test('returns first char uppercased when no uppercase letters exist', () => {
    expect(getUppercase('alice')).toBe('A')
    expect(getUppercase('bob the builder')).toBe('B')
  })

  test('works with single-character strings', () => {
    expect(getUppercase('a')).toBe('A')
    expect(getUppercase('Z')).toBe('Z')
  })

  test('does not treat non A–Z unicode uppercase as uppercase (current behavior)', () => {
    // 'Ä' is not between 'A' and 'Z' in this check
    expect(getUppercase('älpha')).toBe('Ä') // fallback uses first char uppercased
    expect(getUppercase('Älpha')).toBe('Ä') // still fallback path
  })

  /**
   * Optional: documents behavior for empty string.
   * Current implementation will throw because s[0] is undefined.
   */
  test('throws on empty string (current behavior)', () => {
    expect(() => getUppercase('')).toThrow()
  })
})
