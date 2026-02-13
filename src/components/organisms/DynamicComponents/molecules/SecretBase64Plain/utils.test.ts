import { decodeIfBase64, resolveMultilineRows } from './utils'

describe('decodeIfBase64', () => {
  test('returns original value when decoding is disabled', () => {
    expect(decodeIfBase64('plain-text', false)).toBe('plain-text')
  })

  test('decodes value when decoding is enabled and input is valid base64', () => {
    expect(decodeIfBase64('YWRtaW4=', true)).toBe('admin')
  })

  test('returns original value and logs error for invalid base64 input', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const invalid = '*not-base64*'

    expect(decodeIfBase64(invalid, true)).toBe(invalid)
    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })
})

describe('resolveMultilineRows', () => {
  test('uses computed rows with minimum of 3', () => {
    expect(resolveMultilineRows('single line')).toBe(3)
  })

  test('uses computed rows with maximum of 12', () => {
    const manyLines = Array.from({ length: 30 }, (_, i) => `line-${i}`).join('\n')

    expect(resolveMultilineRows(manyLines)).toBe(12)
  })

  test('uses provided multilineRows when finite and floors/clamps it', () => {
    expect(resolveMultilineRows('a\nb', 6.9)).toBe(6)
    expect(resolveMultilineRows('a\nb', 0)).toBe(1)
    expect(resolveMultilineRows('a\nb', 99)).toBe(30)
  })
})
