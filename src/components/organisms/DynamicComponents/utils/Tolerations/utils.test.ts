/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTolerationsItemsInside, filterTolerations, isToleration } from './utils'
import type { TToleration } from './types'

describe('isToleration', () => {
  test('returns false for non-objects and arrays', () => {
    expect(isToleration(null)).toBe(false)
    expect(isToleration(undefined)).toBe(false)
    expect(isToleration('x')).toBe(false)
    expect(isToleration(123)).toBe(false)
    expect(isToleration(true)).toBe(false)
    expect(isToleration([])).toBe(false)
  })

  test('accepts empty object (all fields optional)', () => {
    expect(isToleration({})).toBe(true)
  })

  test('key if present must be string', () => {
    expect(isToleration({ key: 1 })).toBe(false)
    expect(isToleration({ key: null })).toBe(false)
    expect(isToleration({ key: 'dedicated' })).toBe(true)
  })

  test('value if present must be string', () => {
    expect(isToleration({ value: 1 })).toBe(false)
    expect(isToleration({ value: null })).toBe(false)
    expect(isToleration({ value: 'gpu' })).toBe(true)
  })

  test('operator if present must be allowed', () => {
    expect(isToleration({ operator: 123 })).toBe(false)
    expect(isToleration({ operator: 'Bogus' })).toBe(false)
    expect(isToleration({ operator: 'Exists' })).toBe(true)
    expect(isToleration({ operator: 'Equal' })).toBe(true)
  })

  test('effect if present must be allowed', () => {
    expect(isToleration({ effect: 123 })).toBe(false)
    expect(isToleration({ effect: 'Bogus' })).toBe(false)
    expect(isToleration({ effect: 'NoSchedule' })).toBe(true)
    expect(isToleration({ effect: 'PreferNoSchedule' })).toBe(true)
    expect(isToleration({ effect: 'NoExecute' })).toBe(true)
  })

  test('accepts a typical valid toleration object', () => {
    const t: TToleration = {
      key: 'dedicated',
      operator: 'Equal',
      value: 'gpu',
      effect: 'NoSchedule',
      // tolerationSeconds omitted (not validated)
    } as any

    expect(isToleration(t)).toBe(true)
  })

  test('rejects when key/value types are wrong even if operator/effect are valid', () => {
    expect(
      isToleration({
        key: 123,
        operator: 'Exists',
        effect: 'NoSchedule',
      }),
    ).toBe(false)

    expect(
      isToleration({
        value: {},
        operator: 'Equal',
        effect: 'NoExecute',
      }),
    ).toBe(false)
  })
})

describe('filterTolerations', () => {
  test('returns empty array for non-array input', () => {
    expect(filterTolerations(undefined)).toEqual([])
    expect(filterTolerations(null)).toEqual([])
    expect(filterTolerations({})).toEqual([])
    expect(filterTolerations('x')).toEqual([])
  })

  test('filters only valid toleration-like objects', () => {
    const input = [
      { key: 'k1', operator: 'Exists', effect: 'NoSchedule' },
      { key: 123 }, // invalid
      { value: 'v1', operator: 'Equal', effect: 'NoExecute' },
      { operator: 'Bogus' }, // invalid
      { effect: 'Bogus' }, // invalid
      {}, // valid (all optional)
      null,
      1,
    ] as any

    expect(filterTolerations(input)).toEqual([
      { key: 'k1', operator: 'Exists', effect: 'NoSchedule' },
      { value: 'v1', operator: 'Equal', effect: 'NoExecute' },
      {},
    ])
  })
})

describe('getTolerationsItemsInside', () => {
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  test('returns error when value is not an array', () => {
    expect(getTolerationsItemsInside(undefined as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getTolerationsItemsInside(null as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getTolerationsItemsInside({} as any)).toEqual({ error: 'Value on jsonPath is not an array' })
  })

  test('returns "Error while flattening" when inner element is not iterable', () => {
    const value = [1] as any
    const res = getTolerationsItemsInside(value)

    expect(res).toEqual({ error: 'Error while flattening' })
    expect(consoleLogSpy).toHaveBeenCalled()
  })

  test('returns counter and filtered tolerations for valid nested arrays', () => {
    const value = [
      [{ key: 'dedicated', operator: 'Exists', effect: 'NoSchedule' }],
      [{ operator: 'Bogus' }], // invalid
      [1], // ignored by filter, still counts
      [{}], // valid
      [{ value: 'gpu', operator: 'Equal', effect: 'PreferNoSchedule' }],
    ] as any

    const res = getTolerationsItemsInside(value)

    expect(res.counter).toBe(5)
    expect(res.tolerations).toEqual([
      { key: 'dedicated', operator: 'Exists', effect: 'NoSchedule' },
      {},
      { value: 'gpu', operator: 'Equal', effect: 'PreferNoSchedule' },
    ])
  })

  test('handles empty outer array', () => {
    const res = getTolerationsItemsInside([] as any)
    expect(res).toEqual({ counter: 0, tolerations: [] })
  })

  test('handles empty inner arrays', () => {
    const res = getTolerationsItemsInside([[], []] as any)
    expect(res).toEqual({ counter: 0, tolerations: [] })
  })
})
