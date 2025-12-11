// seriesToStackedAreaData.test.ts
import { seriesToStackedAreaData } from './matrixToAreaStackedAdapter'
import type { TRechartsSeries } from '../toLine'

describe('seriesToStackedAreaData', () => {
  test('returns empty array when series is undefined', () => {
    expect(seriesToStackedAreaData(undefined)).toEqual([])
  })

  test('returns empty array when series is empty', () => {
    expect(seriesToStackedAreaData([])).toEqual([])
  })

  test('builds stacked data for a single series', () => {
    const series: TRechartsSeries[] = [
      {
        id: 'c1',
        metric: { container: 'c1' },
        data: [
          { timestamp: 1000, value: 1 },
          { timestamp: 2000, value: 2 },
        ],
      },
    ]

    expect(seriesToStackedAreaData(series)).toEqual([
      { timestamp: 1000, c1: 1 },
      { timestamp: 2000, c1: 2 },
    ])
  })

  test('merges multiple series on the same timestamps', () => {
    const series: TRechartsSeries[] = [
      {
        id: 'c1',
        metric: { container: 'c1' },
        data: [
          { timestamp: 1000, value: 1 },
          { timestamp: 2000, value: 2 },
        ],
      },
      {
        id: 'p2',
        metric: { pod: 'p2' },
        data: [
          { timestamp: 1000, value: 3 },
          { timestamp: 3000, value: 4 },
        ],
      },
    ]

    expect(seriesToStackedAreaData(series)).toEqual([
      { timestamp: 1000, c1: 1, p2: 3 },
      { timestamp: 2000, c1: 2 },
      { timestamp: 3000, p2: 4 },
    ])
  })

  test('sorts points by ascending timestamp', () => {
    const series: TRechartsSeries[] = [
      {
        id: 's1',
        metric: {},
        data: [
          { timestamp: 3000, value: 3 },
          { timestamp: 1000, value: 1 },
          { timestamp: 2000, value: 2 },
        ],
      },
    ]

    expect(seriesToStackedAreaData(series)).toEqual([
      { timestamp: 1000, s1: 1 },
      { timestamp: 2000, s1: 2 },
      { timestamp: 3000, s1: 3 },
    ])
  })

  test('skips points with non-finite timestamps or values', () => {
    const series: TRechartsSeries[] = [
      {
        id: 'c1',
        metric: {},
        data: [
          { timestamp: 1000, value: 1 },
          { timestamp: Number.NaN, value: 2 }, // invalid ts
          { timestamp: 2000, value: Number.POSITIVE_INFINITY }, // invalid value
          { timestamp: 3000, value: 3 },
        ],
      },
    ]

    expect(seriesToStackedAreaData(series)).toEqual([
      { timestamp: 1000, c1: 1 },
      { timestamp: 3000, c1: 3 },
    ])
  })

  test('gracefully handles series with missing data', () => {
    const series: TRechartsSeries[] = [
      {
        id: 'empty',
        metric: {},
        data: undefined,
      },
      {
        id: 'nonEmpty',
        metric: {},
        data: [{ timestamp: 1000, value: 42 }],
      },
    ]

    expect(seriesToStackedAreaData(series)).toEqual([{ timestamp: 1000, nonEmpty: 42 }])
  })
})
