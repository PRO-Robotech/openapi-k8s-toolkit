/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
import type { TPrometheusVectorResponse } from './types'
import { pickSeriesId } from './helpers'
import { vectorToBarVertical, vectorToBarHorizontal } from './toBar/vectorToBarAdapter'
import { vectorToPie } from './toPie/vectorToPieAdapter'
import { vectorToBarGauge } from './toBarGauge/vectorToBarGaugeAdapter'
import { vectorToGaugeRadial } from './toGaugeRadial/vectorToGaugeRadialAdapter'
import { vectorToTableRows } from './toTableRows/vectorToTableRowsAdapter'

/**
 * Mock pickSeriesId so we can:
 *  - verify it is called with (metric, idx)
 *  - control returned ids deterministically
 */
jest.mock('./helpers', () => ({
  pickSeriesId: jest.fn((metric: Record<string, string>, idx: number) => metric.__id ?? `mock_${idx}`),
}))

const pickSeriesIdMock = pickSeriesId as unknown as jest.Mock

const makeResp = (overrides: Partial<TPrometheusVectorResponse> = {}): TPrometheusVectorResponse => ({
  status: 'success',
  data: {
    resultType: 'vector',
    result: [],
  },
  ...overrides,
})

describe('vectorToBarVertical', () => {
  beforeEach(() => pickSeriesIdMock.mockClear())

  it('returns [] when status is not success', () => {
    const resp = makeResp({ status: 'error' as const })
    expect(vectorToBarVertical(resp)).toEqual([])
    expect(pickSeriesIdMock).not.toHaveBeenCalled()
  })

  it('returns [] when result is missing or empty', () => {
    expect(vectorToBarVertical(makeResp())).toEqual([])

    // if your TS allows this runtime case
    const resp = makeResp({ data: { resultType: 'vector', result: undefined as any } })
    expect(vectorToBarVertical(resp)).toEqual([])
  })

  it('maps vector result to bar items (timestamp ms + number)', () => {
    const resp = makeResp({
      data: {
        resultType: 'vector',
        result: [
          { metric: { __id: 'A', pod: 'p1' }, value: [10, '1.5'] },
          { metric: { __id: 'B', job: 'j1' }, value: [11, '2'] },
        ],
      },
    })

    expect(vectorToBarVertical(resp)).toEqual([
      { id: 'A', metric: { __id: 'A', pod: 'p1' }, timestamp: 10_000, value: 1.5 },
      { id: 'B', metric: { __id: 'B', job: 'j1' }, timestamp: 11_000, value: 2 },
    ])

    expect(pickSeriesIdMock).toHaveBeenNthCalledWith(1, { __id: 'A', pod: 'p1' }, 0)
    expect(pickSeriesIdMock).toHaveBeenNthCalledWith(2, { __id: 'B', job: 'j1' }, 1)
  })

  it('handles missing metric/value gracefully', () => {
    const resp = makeResp({
      data: {
        resultType: 'vector',
        result: [{ metric: undefined as any, value: undefined as any }],
      },
    })

    expect(vectorToBarVertical(resp)).toEqual([{ id: 'mock_0', metric: {}, timestamp: 0, value: 0 }])
  })
})

describe('vectorToBarHorizontal', () => {
  beforeEach(() => pickSeriesIdMock.mockClear())

  it('returns [] when status is not success', () => {
    const resp = makeResp({ status: 'error' as const })
    expect(vectorToBarHorizontal(resp)).toEqual([])
  })

  it('returns [] when result is missing or empty', () => {
    expect(vectorToBarHorizontal(makeResp())).toEqual([])
    const resp = makeResp({ data: { resultType: 'vector', result: undefined as any } })
    expect(vectorToBarHorizontal(resp)).toEqual([])
  })

  it('maps vector result to bar items (same shape as vertical)', () => {
    const resp = makeResp({
      data: {
        resultType: 'vector',
        result: [{ metric: { __id: 'X' }, value: [12, '3'] }],
      },
    })

    expect(vectorToBarHorizontal(resp)).toEqual([{ id: 'X', metric: { __id: 'X' }, timestamp: 12_000, value: 3 }])
  })
})

describe('vectorToPie', () => {
  beforeEach(() => pickSeriesIdMock.mockClear())

  it('returns [] when status is not success', () => {
    const resp = makeResp({ status: 'error' as const })
    expect(vectorToPie(resp)).toEqual([])
    expect(pickSeriesIdMock).not.toHaveBeenCalled()
  })

  it('returns [] when result is missing', () => {
    const resp = makeResp({ data: { resultType: 'vector', result: undefined as any } })
    expect(vectorToPie(resp)).toEqual([])
  })

  it('maps slices with id/value/metric', () => {
    const resp = makeResp({
      data: {
        resultType: 'vector',
        result: [
          { metric: { __id: 'A', instance: 'i1' }, value: [100, '10'] },
          { metric: { __id: 'B', instance: 'i2' }, value: [101, '20.25'] },
        ],
      },
    })

    expect(vectorToPie(resp)).toEqual([
      { id: 'A', value: 10, metric: { __id: 'A', instance: 'i1' } },
      { id: 'B', value: 20.25, metric: { __id: 'B', instance: 'i2' } },
    ])
  })

  it('handles missing metric/value gracefully', () => {
    const resp = makeResp({
      data: { resultType: 'vector', result: [{ metric: undefined as any, value: undefined as any }] },
    })

    expect(vectorToPie(resp)).toEqual([{ id: 'mock_0', value: 0, metric: {} }])
  })
})

describe('vectorToBarGauge', () => {
  beforeEach(() => pickSeriesIdMock.mockClear())

  it('returns [] when status is not success', () => {
    const resp = makeResp({ status: 'error' as const })
    expect(vectorToBarGauge(resp)).toEqual([])
  })

  it('returns [] when result is missing', () => {
    const resp = makeResp({ data: { resultType: 'vector', result: undefined as any } })
    expect(vectorToBarGauge(resp)).toEqual([])
  })

  it('maps items and sorts descending by value', () => {
    const resp = makeResp({
      data: {
        resultType: 'vector',
        result: [
          { metric: { __id: 'A' }, value: [1, '2'] },
          { metric: { __id: 'B' }, value: [1, '10'] },
          { metric: { __id: 'C' }, value: [1, '5'] },
        ],
      },
    })

    expect(vectorToBarGauge(resp)).toEqual([
      { id: 'B', value: 10, metric: { __id: 'B' } },
      { id: 'C', value: 5, metric: { __id: 'C' } },
      { id: 'A', value: 2, metric: { __id: 'A' } },
    ])
  })

  it('handles missing metric/value gracefully', () => {
    const resp = makeResp({
      data: { resultType: 'vector', result: [{ metric: undefined as any, value: undefined as any }] },
    })

    expect(vectorToBarGauge(resp)).toEqual([{ id: 'mock_0', value: 0, metric: {} }])
  })
})

describe('vectorToGaugeRadial', () => {
  beforeEach(() => pickSeriesIdMock.mockClear())

  it('returns null when status is not success', () => {
    const resp = makeResp({ status: 'error' as const })
    expect(vectorToGaugeRadial(resp)).toBeNull()
  })

  it('returns null when result is missing/empty', () => {
    expect(vectorToGaugeRadial(makeResp())).toBeNull()
    const resp = makeResp({ data: { resultType: 'vector', result: undefined as any } })
    expect(vectorToGaugeRadial(resp)).toBeNull()
  })

  it('returns the first series as gauge value', () => {
    const resp = makeResp({
      data: {
        resultType: 'vector',
        result: [
          { metric: { __id: 'FIRST' }, value: [123, '42'] },
          { metric: { __id: 'SECOND' }, value: [124, '99'] },
        ],
      },
    })

    expect(vectorToGaugeRadial(resp)).toEqual({
      id: 'FIRST',
      value: 42,
      metric: { __id: 'FIRST' },
    })

    expect(pickSeriesIdMock).toHaveBeenCalledWith({ __id: 'FIRST' }, 0)
  })

  it('handles missing metric/value gracefully', () => {
    const resp = makeResp({
      data: { resultType: 'vector', result: [{ metric: undefined as any, value: undefined as any }] },
    })

    expect(vectorToGaugeRadial(resp)).toEqual({
      id: 'mock_0',
      value: 0,
      metric: {},
    })
  })
})

describe('vectorToTableRows', () => {
  beforeEach(() => pickSeriesIdMock.mockClear())

  it('returns [] when status is not success', () => {
    const resp = makeResp({ status: 'error' as const })
    expect(vectorToTableRows(resp)).toEqual([])
  })

  it('returns [] when result is missing', () => {
    const resp = makeResp({ data: { resultType: 'vector', result: undefined as any } })
    expect(vectorToTableRows(resp)).toEqual([])
  })

  it('maps rows with timestamp ms + value number + metric', () => {
    const resp = makeResp({
      data: {
        resultType: 'vector',
        result: [
          { metric: { __id: 'A', pod: 'p1' }, value: [10, '1'] },
          { metric: { __id: 'B', pod: 'p2' }, value: [11, '2.5'] },
        ],
      },
    })

    expect(vectorToTableRows(resp)).toEqual([
      { id: 'A', value: 1, timestamp: 10_000, metric: { __id: 'A', pod: 'p1' } },
      { id: 'B', value: 2.5, timestamp: 11_000, metric: { __id: 'B', pod: 'p2' } },
    ])
  })

  it('handles missing metric/value gracefully', () => {
    const resp = makeResp({
      data: { resultType: 'vector', result: [{ metric: undefined as any, value: undefined as any }] },
    })

    expect(vectorToTableRows(resp)).toEqual([{ id: 'mock_0', value: 0, timestamp: 0, metric: {} }])
  })
})
