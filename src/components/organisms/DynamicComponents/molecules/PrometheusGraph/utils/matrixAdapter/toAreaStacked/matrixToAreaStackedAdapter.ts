import { TRechartsSeries } from '../toLine'

export type TStackedAreaPoint = {
  timestamp: number
  [seriesId: string]: number
}

/**
 * Builds stacked-area-compatible data from TRechartsSeries[].
 * Shape:
 * [
 *   { timestamp: 1000, c1: 1, p2: 3 },
 *   { timestamp: 2000, c1: 2 },
 * ]
 */
export const matrixToStackedAreaData = (series: TRechartsSeries[] | undefined): TStackedAreaPoint[] => {
  if (!series || series.length === 0) return []

  const byTs: Record<number, TStackedAreaPoint> = {}

  series.forEach(s => {
    s.data?.forEach(point => {
      const ts = point.timestamp
      const v = point.value

      if (!Number.isFinite(ts) || !Number.isFinite(v)) return

      if (!byTs[ts]) {
        byTs[ts] = { timestamp: ts }
      }

      byTs[ts][s.id] = v
    })
  })

  return Object.values(byTs).sort((a, b) => a.timestamp - b.timestamp)
}
