import type { TRechartsSeries } from '../toLine'

export type TReducedVectorItem = {
  id: string
  metric: Record<string, string>
  value: number
}

export type TAggregationMode = 'last' | 'avg' | 'sum' | 'max' | 'min'

export const matrixToReducedVector = (
  series: TRechartsSeries[] | undefined,
  mode: TAggregationMode = 'last',
): TReducedVectorItem[] => {
  if (!series || series.length === 0) return []

  return series
    .map<TReducedVectorItem | null>((s: TRechartsSeries) => {
      const points = s.data ?? []
      if (points.length === 0) return null

      // filter only finite values
      const values = points.map(p => p.value).filter(v => Number.isFinite(v))

      if (values.length === 0) return null

      let agg: number

      switch (mode) {
        case 'sum':
          agg = values.reduce((acc, v) => acc + v, 0)
          break
        case 'avg':
          agg = values.reduce((acc, v) => acc + v, 0) / values.length
          break
        case 'max':
          agg = Math.max(...values)
          break
        case 'min':
          agg = Math.min(...values)
          break
        case 'last':
        default: {
          // last *by timestamp* not by array position
          const sorted = points.slice().sort((a, b) => a.timestamp - b.timestamp)

          let lastPoint: (typeof points)[number] | undefined

          for (let i = sorted.length - 1; i >= 0; i -= 1) {
            const p = sorted[i]
            if (Number.isFinite(p.value)) {
              lastPoint = p
              break
            }
          }

          agg = lastPoint ? lastPoint.value : values[values.length - 1]
          break
        }
      }

      return {
        id: s.id,
        metric: s.metric ?? {},
        value: agg,
      }
    })
    .filter((x): x is TReducedVectorItem => x !== null)
}
