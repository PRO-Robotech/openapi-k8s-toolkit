/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import { TPrometheusRangeResponse } from '../types'

export type TSeriesStatsRow = {
  id: string
  metric: Record<string, string>

  min: number | null
  max: number | null
  current: number | null

  // optional: useful for sorting / display
  minTs?: number | null
  maxTs?: number | null
  currentTs?: number | null
}

const pickSeriesId = (metric: Record<string, string>, idx: number) =>
  metric.container || metric.pod || metric.instance || metric.job || `series_${idx}`

const toNumberOrNull = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

export const matrixToTableMinMaxCurrent = (resp: TPrometheusRangeResponse): TSeriesStatsRow[] => {
  if (!resp || resp.status !== 'success' || !resp.data?.result) return []

  return resp.data.result.map((series, idx) => {
    const metric = series.metric || {}
    const id = pickSeriesId(metric, idx)

    // Prom values: [timestampSec, "valueAsString"]
    // We’ll treat "current" as the latest timestamped sample.
    let min: number | null = null
    let max: number | null = null
    let current: number | null = null

    let minTs: number | null = null
    let maxTs: number | null = null
    let currentTs: number | null = null

    for (const [tsSec, vRaw] of series.values ?? []) {
      const v = toNumberOrNull(vRaw)
      if (v == null) continue

      const ts = tsSec * 1000

      if (min == null || v < min) {
        min = v
        minTs = ts
      }
      if (max == null || v > max) {
        max = v
        maxTs = ts
      }

      // "current" = latest timestamp
      if (currentTs == null || ts > currentTs) {
        current = v
        currentTs = ts
      }
    }

    return { id, metric, min, max, current, minTs, maxTs, currentTs }
  })
}
