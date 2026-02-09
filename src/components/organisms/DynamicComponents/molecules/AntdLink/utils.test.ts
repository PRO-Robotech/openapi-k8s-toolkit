import { isExternalHref } from './utils'

describe('isExternalHref', () => {
  test('returns false for empty href', () => {
    expect(isExternalHref('')).toBe(false)
  })

  test('returns true for mailto/tel/sms protocols', () => {
    expect(isExternalHref('mailto:test@example.com')).toBe(true)
    expect(isExternalHref('tel:+123456789')).toBe(true)
    expect(isExternalHref('sms:+123456789')).toBe(true)
  })

  test('returns true for protocol-relative links', () => {
    expect(isExternalHref('//cdn.example.com/app.js')).toBe(true)
  })

  test('returns false for relative internal links', () => {
    expect(isExternalHref('/clusters/c1')).toBe(false)
    expect(isExternalHref('clusters/c1')).toBe(false)
    expect(isExternalHref('?tab=details')).toBe(false)
    expect(isExternalHref('#section')).toBe(false)
  })

  test('returns false for same-origin absolute links', () => {
    expect(isExternalHref(`${window.location.origin}/docs`)).toBe(false)
  })

  test('returns true for cross-origin absolute links', () => {
    expect(isExternalHref('https://kubernetes.io/docs/')).toBe(true)
  })
})
