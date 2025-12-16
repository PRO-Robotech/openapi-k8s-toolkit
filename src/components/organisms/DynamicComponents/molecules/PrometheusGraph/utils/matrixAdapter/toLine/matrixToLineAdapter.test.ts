/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TPrometheusRangeResponse } from '../../../types'
import { matrixToLineSingle, matrixToLineMulti } from './matrixToLineAdapter'

describe('prometheusToRechartsSingle', () => {
  test('returns empty array when status is error', () => {
    const resp: TPrometheusRangeResponse = {
      status: 'error',
      data: {
        resultType: 'matrix',
        result: [],
      },
    }

    expect(matrixToLineSingle(resp)).toEqual([])
  })

  test('returns empty array when result is empty', () => {
    const resp: TPrometheusRangeResponse = {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [],
      },
    }

    expect(matrixToLineSingle(resp)).toEqual([])
  })

  test('maps only the first series values to ChartPoint[]', () => {
    const resp: TPrometheusRangeResponse = {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: { pod: 'p1' },
            values: [
              [100, '1.5'],
              [101, '2'],
            ],
          },
          {
            metric: { pod: 'p2' },
            values: [
              [100, '9'],
              [101, '10'],
            ],
          },
        ],
      },
    }

    expect(matrixToLineSingle(resp)).toEqual([
      { timestamp: 100 * 1000, value: 1.5 },
      { timestamp: 101 * 1000, value: 2 },
    ])
  })

  test('gracefully handles undefined-ish input shape at runtime', () => {
    expect(matrixToLineSingle(undefined as any)).toEqual([])
    expect(matrixToLineSingle({} as any)).toEqual([])
  })
})

describe('prometheusToRechartsMulti', () => {
  test('returns empty array when status is error', () => {
    const resp: TPrometheusRangeResponse = {
      status: 'error',
      data: {
        resultType: 'matrix',
        result: [],
      },
    }

    expect(matrixToLineMulti(resp)).toEqual([])
  })

  test('returns empty array when result is missing', () => {
    const resp = {
      status: 'success',
      data: { resultType: 'matrix' },
    } as any

    expect(matrixToLineMulti(resp)).toEqual([])
  })

  test('maps all series with ids derived from metric preference order', () => {
    const resp: TPrometheusRangeResponse = {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: { container: 'c1', pod: 'p-ignored' },
            values: [
              [10, '1'],
              [11, '2'],
            ],
          },
          {
            metric: { pod: 'p2' },
            values: [[10, '3']],
          },
          {
            metric: { instance: 'i3' },
            values: [[10, '4']],
          },
          {
            metric: { job: 'j4' },
            values: [[10, '5']],
          },
          {
            metric: {}, // no known id fields -> fallback
            values: [[10, '6']],
          },
        ],
      },
    }

    expect(matrixToLineMulti(resp)).toEqual([
      {
        id: 'c1',
        metric: { container: 'c1', pod: 'p-ignored' },
        data: [
          { timestamp: 10 * 1000, value: 1 },
          { timestamp: 11 * 1000, value: 2 },
        ],
      },
      {
        id: 'p2',
        metric: { pod: 'p2' },
        data: [{ timestamp: 10 * 1000, value: 3 }],
      },
      {
        id: 'i3',
        metric: { instance: 'i3' },
        data: [{ timestamp: 10 * 1000, value: 4 }],
      },
      {
        id: 'j4',
        metric: { job: 'j4' },
        data: [{ timestamp: 10 * 1000, value: 5 }],
      },
      {
        id: 'series_4',
        metric: {},
        data: [{ timestamp: 10 * 1000, value: 6 }],
      },
    ])
  })

  test('uses empty object for missing metric', () => {
    const resp: TPrometheusRangeResponse = {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: undefined as any,
            values: [[1, '7']],
          },
        ],
      },
    }

    expect(matrixToLineMulti(resp)).toEqual([
      {
        id: 'series_0',
        metric: {},
        data: [{ timestamp: 1000, value: 7 }],
      },
    ])
  })
})
