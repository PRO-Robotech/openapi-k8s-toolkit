/* eslint-disable @typescript-eslint/no-explicit-any */
import { getItemsInside, filterTaintLikes, isTaintLike } from './utils'
import type { TTaintLike } from './types'

describe('isTaintLike', () => {
  test('returns false for non-objects', () => {
    expect(isTaintLike(null)).toBe(false)
    expect(isTaintLike(undefined)).toBe(false)
    expect(isTaintLike('x')).toBe(false)
    expect(isTaintLike(123)).toBe(false)
    expect(isTaintLike(true)).toBe(false)
    expect(isTaintLike([])).toBe(false)
  })

  test('requires effect to be one of allowed values', () => {
    expect(isTaintLike({})).toBe(false)
    expect(isTaintLike({ effect: 123 })).toBe(false)
    expect(isTaintLike({ effect: 'Bogus' })).toBe(false)
  })

  test('key if present must be string', () => {
    expect(isTaintLike({ effect: 'NoSchedule', key: 1 })).toBe(false)
    expect(isTaintLike({ effect: 'NoSchedule', key: null })).toBe(false)
  })

  test('value if present must be string', () => {
    expect(isTaintLike({ effect: 'NoSchedule', value: 1 })).toBe(false)
    expect(isTaintLike({ effect: 'NoSchedule', value: null })).toBe(false)
  })

  test('accepts minimal valid taint', () => {
    expect(isTaintLike({ effect: 'NoSchedule' })).toBe(true)
    expect(isTaintLike({ effect: 'PreferNoSchedule' })).toBe(true)
    expect(isTaintLike({ effect: 'NoExecute' })).toBe(true)
  })

  test('accepts valid taint with key/value', () => {
    const t: TTaintLike = { key: 'k', value: 'v', effect: 'NoExecute' }
    expect(isTaintLike(t)).toBe(true)
  })
})

describe('filterTaintLikes', () => {
  test('returns empty array for non-array input', () => {
    expect(filterTaintLikes(undefined)).toEqual([])
    expect(filterTaintLikes(null)).toEqual([])
    expect(filterTaintLikes({})).toEqual([])
    expect(filterTaintLikes('x')).toEqual([])
  })

  test('filters only valid taint-like objects', () => {
    const input = [
      { effect: 'NoSchedule' },
      { effect: 'Bogus' },
      { effect: 'NoExecute', key: 'k', value: 'v' },
      { effect: 'PreferNoSchedule', key: 123 },
      null,
      1,
    ]

    expect(filterTaintLikes(input)).toEqual([{ effect: 'NoSchedule' }, { effect: 'NoExecute', key: 'k', value: 'v' }])
  })
})

describe('getItemsInside', () => {
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  test('returns error when value is not an array', () => {
    expect(getItemsInside(undefined as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getItemsInside(null as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getItemsInside({} as any)).toEqual({ error: 'Value on jsonPath is not an array' })
  })

  test('returns "Error while flattening" when inner element is not iterable', () => {
    const value = [1] as any
    const res = getItemsInside(value)

    expect(res).toEqual({ error: 'Error while flattening' })
    expect(consoleLogSpy).toHaveBeenCalled()
  })

  test('returns counter and filtered taints for valid nested arrays', () => {
    const value = [
      [{ effect: 'NoSchedule', key: 'dedicated' }],
      [{ effect: 'Bogus' }],
      [1],
      [{ effect: 'PreferNoSchedule', value: 'gpu' }],
    ] as any

    const res = getItemsInside(value)

    expect(res.counter).toBe(4)
    expect(res.taints).toEqual([
      { effect: 'NoSchedule', key: 'dedicated' },
      { effect: 'PreferNoSchedule', value: 'gpu' },
    ])
  })

  test('handles empty outer array', () => {
    const res = getItemsInside([] as any)
    expect(res).toEqual({ counter: 0, taints: [] })
  })

  test('handles empty inner arrays', () => {
    const res = getItemsInside([[], []] as any)
    expect(res).toEqual({ counter: 0, taints: [] })
  })
})
