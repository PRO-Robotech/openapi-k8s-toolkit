import type { TRechartsSeries } from '../toLine'
import { seriesToReducedVector } from './matrixToReducedVectorAdapter'

describe('seriesToReducedVector', () => {
  test('returns empty array when series is undefined', () => {
    expect(seriesToReducedVector(undefined)).toEqual([])
  })

  test('returns empty array when series is empty', () => {
    expect(seriesToReducedVector([])).toEqual([])
  })

  test('skips series with empty data', () => {
    const series: TRechartsSeries[] = [
      {
        id: 'empty',
        metric: { foo: 'bar' },
        data: [],
      },
      {
        id: 'nonEmpty',
        metric: { foo: 'baz' },
        data: [{ timestamp: 1000, value: 42 }],
      },
    ]

    expect(seriesToReducedVector(series)).toEqual([
      {
        id: 'nonEmpty',
        metric: { foo: 'baz' },
        value: 42,
      },
    ])
  })

  test('skips series where all values are non-finite', () => {
    const series: TRechartsSeries[] = [
      {
        id: 'nanOnly',
        metric: {},
        data: [
          { timestamp: 1, value: Number.NaN },
          { timestamp: 2, value: Number.POSITIVE_INFINITY },
        ],
      },
    ]

    expect(seriesToReducedVector(series)).toEqual([])
  })

  describe('mode = last (default)', () => {
    test('uses the last point by timestamp, not by array order', () => {
      const series: TRechartsSeries[] = [
        {
          id: 's1',
          metric: { container: 'c1' },
          data: [
            { timestamp: 3000, value: 3 },
            { timestamp: 1000, value: 1 },
            { timestamp: 2000, value: 2 },
          ],
        },
      ]

      expect(seriesToReducedVector(series)).toEqual([
        {
          id: 's1',
          metric: { container: 'c1' },
          value: 3, // last by timestamp (3000)
        },
      ])
    })

    test('ignores non-finite values when picking last', () => {
      const series: TRechartsSeries[] = [
        {
          id: 's1',
          metric: {},
          data: [
            { timestamp: 1000, value: 1 },
            { timestamp: 2000, value: Number.NaN },
            { timestamp: 3000, value: 3 },
          ],
        },
      ]

      expect(seriesToReducedVector(series, 'last')).toEqual([
        {
          id: 's1',
          metric: {},
          value: 3,
        },
      ])
    })
  })

  describe('mode = sum', () => {
    test('sums finite values only', () => {
      const series: TRechartsSeries[] = [
        {
          id: 's1',
          metric: {},
          data: [
            { timestamp: 1000, value: 1 },
            { timestamp: 2000, value: 2 },
            { timestamp: 3000, value: Number.NaN },
          ],
        },
      ]

      expect(seriesToReducedVector(series, 'sum')).toEqual([
        {
          id: 's1',
          metric: {},
          value: 3,
        },
      ])
    })
  })

  describe('mode = avg', () => {
    test('computes average of finite values', () => {
      const series: TRechartsSeries[] = [
        {
          id: 's1',
          metric: {},
          data: [
            { timestamp: 1000, value: 1 },
            { timestamp: 2000, value: 3 },
          ],
        },
      ]

      expect(seriesToReducedVector(series, 'avg')).toEqual([
        {
          id: 's1',
          metric: {},
          value: 2, // (1 + 3) / 2
        },
      ])
    })
  })

  describe('mode = max', () => {
    test('takes maximum of finite values', () => {
      const series: TRechartsSeries[] = [
        {
          id: 's1',
          metric: {},
          data: [
            { timestamp: 1000, value: 1 },
            { timestamp: 2000, value: 10 },
            { timestamp: 3000, value: 5 },
          ],
        },
      ]

      expect(seriesToReducedVector(series, 'max')).toEqual([
        {
          id: 's1',
          metric: {},
          value: 10,
        },
      ])
    })
  })

  describe('mode = min', () => {
    test('takes minimum of finite values', () => {
      const series: TRechartsSeries[] = [
        {
          id: 's1',
          metric: {},
          data: [
            { timestamp: 1000, value: 1 },
            { timestamp: 2000, value: -5 },
            { timestamp: 3000, value: 3 },
          ],
        },
      ]

      expect(seriesToReducedVector(series, 'min')).toEqual([
        {
          id: 's1',
          metric: {},
          value: -5,
        },
      ])
    })
  })

  test('handles multiple series', () => {
    const series: TRechartsSeries[] = [
      {
        id: 'a',
        metric: { container: 'a' },
        data: [
          { timestamp: 1000, value: 1 },
          { timestamp: 2000, value: 2 },
        ],
      },
      {
        id: 'b',
        metric: { container: 'b' },
        data: [
          { timestamp: 1500, value: 10 },
          { timestamp: 2500, value: 20 },
        ],
      },
    ]

    expect(seriesToReducedVector(series, 'sum')).toEqual([
      {
        id: 'a',
        metric: { container: 'a' },
        value: 3,
      },
      {
        id: 'b',
        metric: { container: 'b' },
        value: 30,
      },
    ])
  })

  test('uses empty object for missing metric', () => {
    const series: TRechartsSeries[] = [
      {
        id: 's1',
        // @ts-expect-error: metric may be undefined at runtime
        metric: undefined,
        data: [{ timestamp: 1000, value: 7 }],
      },
    ]

    expect(seriesToReducedVector(series)).toEqual([
      {
        id: 's1',
        metric: {},
        value: 7,
      },
    ])
  })
})
