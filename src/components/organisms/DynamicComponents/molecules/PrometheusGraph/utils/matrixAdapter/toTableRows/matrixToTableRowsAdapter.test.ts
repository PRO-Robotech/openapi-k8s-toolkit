/* eslint-disable @typescript-eslint/no-explicit-any */
import { matrixToTableMinMaxCurrent } from './matrixToTableRowsAdapter'

describe('matrixToTableMinMaxCurrent', () => {
  it('returns [] for non-success responses', () => {
    expect(matrixToTableMinMaxCurrent({ status: 'error' } as any)).toEqual([])
    expect(matrixToTableMinMaxCurrent({ status: 'success', data: null } as any)).toEqual([])
    expect(matrixToTableMinMaxCurrent(null as any)).toEqual([])
  })

  it('computes min/max/current for each series', () => {
    const resp = {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: { pod: 'pod-a' },
            values: [
              [10, '5'],
              [20, '2'],
              [30, '9'],
            ],
          },
          {
            metric: { pod: 'pod-b' },
            values: [
              [1, '100'],
              [2, '100'],
              [3, '50'],
            ],
          },
        ],
      },
    } as any

    const rows = matrixToTableMinMaxCurrent(resp)

    expect(rows).toHaveLength(2)

    expect(rows[0]).toMatchObject({
      id: 'pod-a',
      metric: { pod: 'pod-a' },
      min: 2,
      max: 9,
      current: 9,
      minTs: 20_000,
      maxTs: 30_000,
      currentTs: 30_000,
    })

    expect(rows[1]).toMatchObject({
      id: 'pod-b',
      metric: { pod: 'pod-b' },
      min: 50,
      max: 100,
      current: 50,
      minTs: 3_000,
      maxTs: 1_000, // first time it hit 100 is ts=1
      currentTs: 3_000,
    })
  })

  it('uses the latest timestamp for current even if values are out of order', () => {
    const resp = {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: { container: 'c1' },
            values: [
              [30, '3'], // later
              [10, '1'],
              [20, '2'],
            ],
          },
        ],
      },
    } as any

    const [row] = matrixToTableMinMaxCurrent(resp)

    expect(row.id).toBe('c1')
    expect(row.min).toBe(1)
    expect(row.max).toBe(3)
    expect(row.current).toBe(3)
    expect(row.currentTs).toBe(30_000)
  })

  it('skips non-finite values and returns nulls if no numeric points', () => {
    const resp = {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: { pod: 'pod-nan' },
            values: [
              [10, 'NaN'],
              [20, 'not-a-number'],
            ],
          },
          {
            metric: { pod: 'pod-mixed' },
            values: [
              [10, '1'],
              [20, 'NaN'],
              [30, '2'],
            ],
          },
        ],
      },
    } as any

    const rows = matrixToTableMinMaxCurrent(resp)

    expect(rows[0]).toMatchObject({
      id: 'pod-nan',
      min: null,
      max: null,
      current: null,
      minTs: null,
      maxTs: null,
      currentTs: null,
    })

    expect(rows[1]).toMatchObject({
      id: 'pod-mixed',
      min: 1,
      max: 2,
      current: 2,
      minTs: 10_000,
      maxTs: 30_000,
      currentTs: 30_000,
    })
  })

  it('falls back to series_<idx> id when no known metric labels exist', () => {
    const resp = {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          { metric: {}, values: [[1, '1']] },
          { metric: undefined, values: [[1, '2']] },
        ],
      },
    } as any

    const rows = matrixToTableMinMaxCurrent(resp)

    expect(rows[0].id).toBe('series_0')
    expect(rows[1].id).toBe('series_1')
  })
})
