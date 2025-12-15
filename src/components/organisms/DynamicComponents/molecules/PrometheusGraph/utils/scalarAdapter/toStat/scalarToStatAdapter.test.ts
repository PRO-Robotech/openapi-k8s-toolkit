import { TPrometheusScalarResponse } from '../types'
import { scalarToStat } from './scalarToStatAdapter'

describe('scalarToStat', () => {
  test('returns null when status is error', () => {
    const resp = {
      status: 'error',
      data: { resultType: 'scalar', result: [1700000000, '123'] },
    } as unknown as TPrometheusScalarResponse

    expect(scalarToStat(resp)).toBeNull()
  })

  test('returns null when result is missing', () => {
    const resp = {
      status: 'success',
      data: { resultType: 'scalar' },
    } as unknown as TPrometheusScalarResponse

    expect(scalarToStat(resp)).toBeNull()
  })

  test('maps scalar to stat with default id', () => {
    const resp: TPrometheusScalarResponse = {
      status: 'success',
      data: { resultType: 'scalar', result: [1700000000, '42'] },
    }

    expect(scalarToStat(resp)).toEqual({ id: 'scalar', value: 42 })
  })

  test('uses provided id', () => {
    const resp: TPrometheusScalarResponse = {
      status: 'success',
      data: { resultType: 'scalar', result: [1700000000, '42'] },
    }

    expect(scalarToStat(resp, { id: 'cpu' })).toEqual({ id: 'cpu', value: 42 })
  })

  test('coerces string value to number (including decimals)', () => {
    const resp: TPrometheusScalarResponse = {
      status: 'success',
      data: { resultType: 'scalar', result: [1700000000, '3.14'] },
    }

    expect(scalarToStat(resp)).toEqual({ id: 'scalar', value: 3.14 })
  })
})
