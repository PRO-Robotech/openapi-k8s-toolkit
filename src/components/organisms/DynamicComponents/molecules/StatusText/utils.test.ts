/* eslint-disable @typescript-eslint/no-explicit-any */
import { getResult } from './utils'

describe('getResult', () => {
  const base = {
    valuesPrepared: ['a', 'b'],
    criteriaSuccess: 'equals' as const,
    criteriaError: 'equals' as const,
    stategySuccess: undefined as any,
    strategyError: undefined as any,
    valueToCompareSuccess: ['a', 'b', 'c'] as unknown[],
    valueToCompareError: ['x', 'y'] as unknown[],
    successText: 'OK',
    errorText: 'BAD',
    fallbackText: 'WARN',
  }

  test('returns success when stategySuccess="some" and criteriaSuccess="equals" and any value matches', () => {
    const res = getResult({
      ...base,
      valuesPrepared: ['nope', 'a'],
      stategySuccess: 'some',
      criteriaSuccess: 'equals',
      valueToCompareSuccess: ['a'],
    })

    expect(res).toEqual({ type: 'success', text: 'OK' })
  })

  test('returns success when stategySuccess="some" and criteriaSuccess="notEquals" and any value does NOT match', () => {
    const res = getResult({
      ...base,
      valuesPrepared: ['a', 'b'],
      stategySuccess: 'some',
      criteriaSuccess: 'notEquals',
      valueToCompareSuccess: ['a'], // "b" is not included -> some(!includes) => true
    })

    expect(res).toEqual({ type: 'success', text: 'OK' })
  })

  test('defaults to "every" for success strategy when stategySuccess is undefined', () => {
    const resAllMatch = getResult({
      ...base,
      valuesPrepared: ['a', 'b'],
      stategySuccess: undefined,
      criteriaSuccess: 'equals',
      valueToCompareSuccess: ['a', 'b', 'c'],
    })

    expect(resAllMatch).toEqual({ type: 'success', text: 'OK' })

    const resNotAllMatch = getResult({
      ...base,
      valuesPrepared: ['a', 'b'],
      stategySuccess: undefined,
      criteriaSuccess: 'equals',
      valueToCompareSuccess: ['a'], // "b" missing -> every(includes) => false
    })

    expect(resNotAllMatch).not.toEqual({ type: 'success', text: 'OK' })
  })

  test('returns error when success false and strategyError="some" with criteriaError="equals" and any value matches error list', () => {
    const res = getResult({
      ...base,
      valuesPrepared: ['x', 'zzz'],
      // make success definitely false
      criteriaSuccess: 'equals',
      stategySuccess: 'every',
      valueToCompareSuccess: ['a'],
      // error condition
      strategyError: 'some',
      criteriaError: 'equals',
      valueToCompareError: ['x'],
    })

    expect(res).toEqual({ type: 'danger', text: 'BAD' })
  })

  test('defaults to "every" for error strategy when strategyError is undefined', () => {
    const res = getResult({
      ...base,
      valuesPrepared: ['x', 'y'],
      // make success false
      criteriaSuccess: 'equals',
      stategySuccess: 'every',
      valueToCompareSuccess: ['a'],
      // error should succeed via default every
      strategyError: undefined,
      criteriaError: 'equals',
      valueToCompareError: ['x', 'y', 'z'],
    })

    expect(res).toEqual({ type: 'danger', text: 'BAD' })
  })

  test('returns fallback when neither success nor error conditions are met', () => {
    const res = getResult({
      ...base,
      valuesPrepared: ['a', 'b'],
      // success false
      criteriaSuccess: 'equals',
      stategySuccess: 'every',
      valueToCompareSuccess: ['a'], // missing "b"
      // error false
      strategyError: 'every',
      criteriaError: 'equals',
      valueToCompareError: ['x'], // does not include both a & b
    })

    expect(res).toEqual({ type: 'warning', text: 'WARN' })
  })

  test('edge: empty valuesPrepared yields success under default "every" logic', () => {
    const res = getResult({
      ...base,
      valuesPrepared: [],
      stategySuccess: undefined,
      criteriaSuccess: 'equals',
      valueToCompareSuccess: [],
    })

    // Array.every on empty => true, so success wins
    expect(res).toEqual({ type: 'success', text: 'OK' })
  })
})
