import { TPrometheusScalarResponse } from '../types'
import { scalarToGauge } from './scalarToGaugeAdapter'

describe('scalarToGauge', () => {
  test('returns null when status is error', () => {
    const resp = {
      status: 'error',
      data: { resultType: 'scalar', result: [1700000000, '123'] },
    } as unknown as TPrometheusScalarResponse

    expect(scalarToGauge(resp)).toBeNull()
  })

  test('returns null when result is missing', () => {
    const resp = {
      status: 'success',
      data: { resultType: 'scalar' },
    } as unknown as TPrometheusScalarResponse

    expect(scalarToGauge(resp)).toBeNull()
  })

  test('maps scalar to gauge with default id', () => {
    const resp: TPrometheusScalarResponse = {
      status: 'success',
      data: { resultType: 'scalar', result: [1700000000, '7'] },
    }

    expect(scalarToGauge(resp)).toEqual({ id: 'scalar', value: 7 })
  })

  test('uses provided id', () => {
    const resp: TPrometheusScalarResponse = {
      status: 'success',
      data: { resultType: 'scalar', result: [1700000000, '7'] },
    }

    expect(scalarToGauge(resp, { id: 'mem' })).toEqual({ id: 'mem', value: 7 })
  })

  test('includes min/max only when provided', () => {
    const resp: TPrometheusScalarResponse = {
      status: 'success',
      data: { resultType: 'scalar', result: [1700000000, '7'] },
    }

    expect(scalarToGauge(resp, { min: 0 })).toEqual({ id: 'scalar', value: 7, min: 0 })
    expect(scalarToGauge(resp, { max: 100 })).toEqual({ id: 'scalar', value: 7, max: 100 })
    expect(scalarToGauge(resp, { min: 0, max: 100 })).toEqual({
      id: 'scalar',
      value: 7,
      min: 0,
      max: 100,
    })
  })

  test('allows min/max = 0 (does not drop falsy values)', () => {
    const resp: TPrometheusScalarResponse = {
      status: 'success',
      data: { resultType: 'scalar', result: [1700000000, '0'] },
    }

    expect(scalarToGauge(resp, { min: 0, max: 0 })).toEqual({
      id: 'scalar',
      value: 0,
      min: 0,
      max: 0,
    })
  })
})
