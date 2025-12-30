/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSortedPropertyKeys } from './getSortedPropertyKeys'

describe('getSortedPropertyKeys', () => {
  const props = (keys: string[]) =>
    keys.reduce<Record<string, any>>((acc, k) => {
      acc[k] = { type: 'string' }
      return acc
    }, {})

  test('returns Object.keys when sortPaths is undefined', () => {
    const properties = props(['a', 'b', 'c'])

    const res = getSortedPropertyKeys({
      name: [],
      properties,
    } as any)

    expect(res).toEqual(['a', 'b', 'c'])
  })

  test('returns Object.keys when sortPaths is empty', () => {
    const properties = props(['a', 'b', 'c'])

    const res = getSortedPropertyKeys({
      name: [],
      sortPaths: [],
      properties,
    } as any)

    expect(res).toEqual(['a', 'b', 'c'])
  })

  test('root level: uses only sortPaths of length 1', () => {
    const properties = props(['a', 'b', 'c', 'd'])

    const sortPaths = [
      ['c'],
      ['a'],
      ['spec', 'x'], // should be ignored at root because length !== 1
    ]

    const res = getSortedPropertyKeys({
      name: [],
      sortPaths,
      properties,
    } as any)

    // c then a are ordered, others keep their relative order after them
    expect(res).toEqual(['c', 'a', 'b', 'd'])
  })

  test('root level: if no matching root sort paths, returns Object.keys', () => {
    const properties = props(['a', 'b', 'c'])

    const sortPaths = [
      ['spec', 'b'],
      ['spec', 'a'],
    ]

    const res = getSortedPropertyKeys({
      name: [],
      sortPaths,
      properties,
    } as any)

    expect(res).toEqual(['a', 'b', 'c'])
  })

  test('nested level: matches parent path and sorts by last segment', () => {
    const properties = props(['a', 'b', 'c', 'd'])

    const sortPaths = [
      ['spec', 'c'],
      ['spec', 'a'],
      ['other', 'b'],
    ]

    const res = getSortedPropertyKeys({
      name: ['spec'],
      sortPaths,
      properties,
    } as any)

    expect(res).toEqual(['c', 'a', 'b', 'd'])
  })

  test('nested level: name as string is treated as [name]', () => {
    const properties = props(['x', 'y', 'z'])

    const sortPaths = [
      ['spec', 'y'],
      ['spec', 'x'],
    ]

    const res = getSortedPropertyKeys({
      name: 'spec',
      sortPaths,
      properties,
    } as any)

    expect(res).toEqual(['y', 'x', 'z'])
  })

  test('deep nested: matches the exact parent path using path.slice(0, -1)', () => {
    const properties = props(['one', 'two', 'three'])

    const sortPaths = [
      ['spec', 'template', 'two'],
      ['spec', 'template', 'one'],
      ['spec', 'other', 'three'],
    ]

    const res = getSortedPropertyKeys({
      name: ['spec', 'template'],
      sortPaths,
      properties,
    } as any)

    expect(res).toEqual(['two', 'one', 'three'])
  })

  test('nested level: if no matching sortPaths for this path, returns Object.keys', () => {
    const properties = props(['a', 'b', 'c'])

    const sortPaths = [
      ['spec', 'b'],
      ['spec', 'a'],
    ]

    const res = getSortedPropertyKeys({
      name: ['spec', 'template'],
      sortPaths,
      properties,
    } as any)

    expect(res).toEqual(['a', 'b', 'c'])
  })

  test('partial sort order: keys not listed are placed after listed keys', () => {
    const properties = props(['a', 'b', 'c', 'd', 'e'])

    const sortPaths = [
      ['spec', 'd'],
      ['spec', 'b'],
    ]

    const res = getSortedPropertyKeys({
      name: ['spec'],
      sortPaths,
      properties,
    } as any)

    expect(res).toEqual(['d', 'b', 'a', 'c', 'e'])
  })

  test('handles sortPaths with duplicate keys gracefully (last map set wins index order is still deterministic)', () => {
    const properties = props(['a', 'b', 'c'])

    const sortPaths = [
      ['spec', 'b'],
      ['spec', 'b'],
      ['spec', 'a'],
    ]

    const res = getSortedPropertyKeys({
      name: ['spec'],
      sortPaths,
      properties,
    } as any)

    // b is still before a due to earlier index assignment,
    // duplicates should not break sorting
    expect(res[0]).toBe('b')
    expect(res).toEqual(['b', 'a', 'c'])
  })
})
