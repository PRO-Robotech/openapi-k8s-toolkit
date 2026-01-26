/* eslint-disable @typescript-eslint/no-explicit-any */
import { getItemCounterItemsInside } from './getItemCounterItemsInside'

describe('getItemCounterItemsInside (flatten + counter)', () => {
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  test('returns error when value is not an array', () => {
    expect(getItemCounterItemsInside(undefined as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getItemCounterItemsInside(null as any)).toEqual({ error: 'Value on jsonPath is not an array' })
    expect(getItemCounterItemsInside({} as any)).toEqual({ error: 'Value on jsonPath is not an array' })
  })

  test('counts items after flattening one level', () => {
    const value = [[1, 2], ['a'], [null, { x: 1 }]] as any

    const res = getItemCounterItemsInside(value)
    expect(res).toEqual({ counter: 5 })
  })

  test('handles empty outer array', () => {
    expect(getItemCounterItemsInside([] as any)).toEqual({ counter: 0 })
  })

  test('handles inner empty arrays', () => {
    const value = [[], [], [1]] as any
    expect(getItemCounterItemsInside(value)).toEqual({ counter: 1 })
  })

  test('returns "Error while flattening" when inner element is not iterable', () => {
    // flattenOnce will try to spread a non-iterable "row"
    const value = [1] as any
    const res = getItemCounterItemsInside(value)

    expect(res).toEqual({ error: 'Error while flattening' })
    expect(consoleLogSpy).toHaveBeenCalled() // optional, but nice to lock behavior
  })
})
