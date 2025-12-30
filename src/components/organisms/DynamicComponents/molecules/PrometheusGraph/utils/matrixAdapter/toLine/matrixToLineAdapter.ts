import { TPrometheusRangeResponse } from '../../../types'

export type TChartPoint = {
  timestamp: number
  value: number
}

export const matrixToLineSingle = (resp: TPrometheusRangeResponse): TChartPoint[] =>
  resp?.status === 'success' && resp.data?.result?.length > 0
    ? resp.data.result[0].values.map(([ts, v]) => ({
        timestamp: ts * 1000,
        value: Number(v),
      }))
    : []

export type TRechartsSeries = {
  id: string
  metric: Record<string, string>
  data?: TChartPoint[]
}

export const matrixToLineMulti = (resp: TPrometheusRangeResponse): TRechartsSeries[] => {
  if (resp.status !== 'success' || !resp.data?.result) return []

  return resp.data.result.map((series, idx) => {
    const metric = series.metric || {}

    const id = metric.container || metric.pod || metric.instance || metric.job || `series_${idx}`

    const data: TChartPoint[] = series.values.map(([ts, v]) => ({
      timestamp: ts * 1000, // prom timestamp -> ms
      value: Number(v),
    }))

    return { id, metric, data }
  })
}
