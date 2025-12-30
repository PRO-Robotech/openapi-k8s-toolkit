/* eslint-disable @typescript-eslint/no-explicit-any */
import { getItemsInside } from './utils'

describe('getItemsInside (flatten + counter)', () => {
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

  test('counts items after flattening one level', () => {
    const value = [[1, 2], ['a'], [null, { x: 1 }]] as any

    const res = getItemsInside(value)
    expect(res).toEqual({ counter: 5 })
  })

  test('handles empty outer array', () => {
    expect(getItemsInside([] as any)).toEqual({ counter: 0 })
  })

  test('handles inner empty arrays', () => {
    const value = [[], [], [1]] as any
    expect(getItemsInside(value)).toEqual({ counter: 1 })
  })

  test('returns "Error while flattening" when inner element is not iterable', () => {
    // flattenOnce will try to spread a non-iterable "row"
    const value = [1] as any
    const res = getItemsInside(value)

    expect(res).toEqual({ error: 'Error while flattening' })
    expect(consoleLogSpy).toHaveBeenCalled() // optional, but nice to lock behavior
  })
})
