import { getPrefixSubarrays } from './getPrefixSubArrays'

describe('getPrefixSubarrays', () => {
  test('returns prefix subarrays for string array', () => {
    expect(getPrefixSubarrays(['a', 'b', 'c'])).toEqual([['a'], ['a', 'b'], ['a', 'b', 'c']])
  })

  test('returns prefix subarrays for mixed array', () => {
    expect(getPrefixSubarrays(['a', 2, 'c'])).toEqual([['a'], ['a', 2], ['a', 2, 'c']])
  })

  test('returns empty array for empty input', () => {
    expect(getPrefixSubarrays([])).toEqual([])
  })

  test('does not mutate the input array', () => {
    const arr: (string | number)[] = ['x', 1, 'y']
    const copy = [...arr]

    getPrefixSubarrays(arr)

    expect(arr).toEqual(copy)
  })
})
