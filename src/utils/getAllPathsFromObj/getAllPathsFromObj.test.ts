/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllPathsFromObj } from './getAllPathsFromObj'

describe('getAllPathsFromObj', () => {
  test('returns empty array for empty object', () => {
    expect(getAllPathsFromObj({} as any)).toEqual([])
  })

  test('returns empty array for empty array', () => {
    expect(getAllPathsFromObj([] as any)).toEqual([])
  })

  test('collects paths for a simple nested object', () => {
    const obj = {
      a: {
        b: 1,
      },
    }

    // For objects, it includes the parent path for nested objects
    expect(getAllPathsFromObj(obj as any)).toEqual([['a'], ['a', 'b']])
  })

  test('collects paths for object with multiple branches', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: 3,
      },
    }

    expect(getAllPathsFromObj(obj as any)).toEqual([['a'], ['b'], ['b', 'c'], ['b', 'd']])
  })

  test('collects paths for arrays using numeric indices', () => {
    const arr = [1, 2, 3]

    expect(getAllPathsFromObj(arr as any)).toEqual([[0], [1], [2]])
  })

  test('collects paths for nested arrays and objects', () => {
    const data = [1, { x: 2, y: { z: 3 } }, [4, 5]]

    expect(getAllPathsFromObj(data as any)).toEqual([[0], [1], [1, 'x'], [1, 'y'], [1, 'y', 'z'], [2], [2, 0], [2, 1]])
  })

  test('treats null as a leaf value (no recursion)', () => {
    const obj = {
      a: null,
      b: { c: null },
    }

    expect(getAllPathsFromObj(obj as any)).toEqual([['a'], ['b'], ['b', 'c']])
  })

  test('supports a non-empty prefix', () => {
    const obj = { a: { b: 1 } }

    expect(getAllPathsFromObj(obj as any, ['root'])).toEqual([
      ['root', 'a'],
      ['root', 'a', 'b'],
    ])
  })

  test('does not mutate input', () => {
    const obj: any = { a: { b: 1 }, arr: [1, { x: 2 }] }
    const snapshot = JSON.parse(JSON.stringify(obj))

    getAllPathsFromObj(obj)

    expect(obj).toEqual(snapshot)
  })
})
