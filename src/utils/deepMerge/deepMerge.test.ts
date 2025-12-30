/* eslint-disable @typescript-eslint/no-explicit-any */
import { deepMerge } from './deepMerge'

describe('deepMerge', () => {
  test('merges shallow properties with b overwriting a', () => {
    const a = { x: 1, y: 2 }
    const b = { y: 9, z: 3 }

    expect(deepMerge(a, b)).toEqual({ x: 1, y: 9, z: 3 })
  })

  test('deeply merges nested plain objects', () => {
    const a = { spec: { a: 1, shared: { x: 1 } } }
    const b = { spec: { b: 2, shared: { y: 2 } } }

    expect(deepMerge(a as any, b as any)).toEqual({
      spec: {
        a: 1,
        b: 2,
        shared: { x: 1, y: 2 },
      },
    })
  })

  test('b overwrites when one side is not a plain object', () => {
    const a = { x: { a: 1 } }
    const b = { x: 5 }

    expect(deepMerge(a as any, b as any)).toEqual({ x: 5 })
  })

  test('arrays are not merged deeply; b overwrites a arrays', () => {
    const a = { list: [1, 2, 3] }
    const b = { list: [9] }

    expect(deepMerge(a as any, b as any)).toEqual({ list: [9] })
  })

  test('null values are overwritten by b', () => {
    const a = { x: null, y: { a: 1 } }
    const b = { x: { nested: true }, y: null }

    expect(deepMerge(a as any, b as any)).toEqual({
      x: { nested: true },
      y: null,
    })
  })

  test('does not mutate inputs', () => {
    const a: any = { spec: { a: 1 }, arr: [1, 2] }
    const b: any = { spec: { b: 2 }, arr: [3] }

    const aCopy = JSON.parse(JSON.stringify(a))
    const bCopy = JSON.parse(JSON.stringify(b))

    deepMerge(a, b)

    expect(a).toEqual(aCopy)
    expect(b).toEqual(bCopy)
  })
})
