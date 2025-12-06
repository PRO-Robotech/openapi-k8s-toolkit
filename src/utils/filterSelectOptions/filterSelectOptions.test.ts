/* eslint-disable @typescript-eslint/no-explicit-any */
import { filterSelectOptions } from './filterSelectOptions'

describe('filterSelectOptions', () => {
  test('matches case-insensitively against string label', () => {
    const option = { label: 'Hello World', value: 'x' } as any

    expect(filterSelectOptions('hello', option)).toBe(true)
    expect(filterSelectOptions('WORLD', option)).toBe(true)
    expect(filterSelectOptions('lo wo', option)).toBe(true)
  })

  test('returns false when label is not a string', () => {
    expect(filterSelectOptions('a', { label: 123 } as any)).toBe(false)
    expect(filterSelectOptions('a', { label: { text: 'abc' } } as any)).toBe(false)
    expect(filterSelectOptions('a', { label: undefined } as any)).toBe(false)
  })

  test('returns false when option is undefined', () => {
    expect(filterSelectOptions('a', undefined)).toBe(false)
  })

  test('empty input matches any string label (current behavior)', () => {
    const option = { label: 'Anything' } as any
    expect(filterSelectOptions('', option)).toBe(true)
  })
})
