/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { toBase64, fromBase64 } from './helpers'

// If your Jest env doesn't provide these (older Node/JSDOM),
// this keeps tests stable.
beforeAll(() => {
  // eslint-disable-next-line global-require
  const util = require('util')

  if (typeof (global as any).TextEncoder === 'undefined') {
    ;(global as any).TextEncoder = util.TextEncoder
  }
  if (typeof (global as any).TextDecoder === 'undefined') {
    ;(global as any).TextDecoder = util.TextDecoder
  }
  // btoa/atob are usually available in jsdom. If not, polyfill.
  if (typeof (global as any).btoa === 'undefined') {
    ;(global as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
  }
  if (typeof (global as any).atob === 'undefined') {
    ;(global as any).atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary')
  }
})

describe('toBase64 / fromBase64', () => {
  test('encodes and decodes ASCII', () => {
    const text = 'hello world'
    const b64 = toBase64(text)

    expect(b64).toBe('aGVsbG8gd29ybGQ=')
    expect(fromBase64(b64)).toBe(text)
  })

  test('round-trips UTF-8 unicode', () => {
    const text = 'Zażółć gęślą jaźń'
    const b64 = toBase64(text)

    expect(fromBase64(b64)).toBe(text)
  })

  test('round-trips emoji', () => {
    const text = '🚀✨💾'
    const b64 = toBase64(text)

    expect(fromBase64(b64)).toBe(text)
  })

  test('fromBase64 returns empty string for null/undefined', () => {
    expect(fromBase64(null as any)).toBe('')
    expect(fromBase64(undefined as any)).toBe('')
  })

  test('accepts URL-safe base64 and missing padding', () => {
    const text = 'hello world'
    const std = toBase64(text) // aGVsbG8gd29ybGQ=

    // Make it URL-safe and remove padding
    const urlSafeNoPad = std.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

    expect(fromBase64(urlSafeNoPad)).toBe(text)
  })

  test('handles padding lengths 2 and 3 correctly', () => {
    // lengths that need padding when stripped
    const text1 = 'hi' // aGk=
    const text2 = 'hey' // aGV5

    const b1 = toBase64(text1).replace(/=+$/g, '')
    const b2 = toBase64(text2).replace(/=+$/g, '')

    expect(fromBase64(b1)).toBe(text1)
    expect(fromBase64(b2)).toBe(text2)
  })

  test('throws on invalid base64 length', () => {
    // length % 4 === 1 should throw according to implementation
    expect(() => fromBase64('abcde')).toThrow('Invalid Base64 length')
  })
})
