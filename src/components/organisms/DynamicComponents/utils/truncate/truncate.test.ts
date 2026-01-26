/* eslint-disable @typescript-eslint/no-explicit-any */
import { truncate } from './truncate'

describe('truncate', () => {
  test('returns original text when max is undefined', () => {
    expect(truncate('hello')).toBe('hello')
  })

  test('returns original text when max is 0 (falsy)', () => {
    expect(truncate('hello', 0)).toBe('hello')
  })

  test('does not truncate when text length <= max', () => {
    expect(truncate('hello', 5)).toBe('hello')
    expect(truncate('hello', 10)).toBe('hello')
  })

  test('truncates and appends ellipsis when text length > max', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
    expect(truncate('abcdef', 3)).toBe('abc...')
  })
})
