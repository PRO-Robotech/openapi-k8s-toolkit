export type PrometheusRangeResponse = {
  status: 'success' | 'error'
  data: {
    resultType: 'matrix'
    result: {
      metric: Record<string, string>
      values: [number, string][]
    }[]
  }
}

export type ChartPoint = {
  timestamp: number
  value: number
}

export const prometheusToRechartsSingle = (resp: PrometheusRangeResponse): ChartPoint[] =>
  resp?.status === 'success' && resp.data?.result?.length > 0
    ? resp.data.result[0].values.map(([ts, v]) => ({
        timestamp: ts * 1000,
        value: Number(v),
      }))
    : []

export type RechartsSeries = {
  id: string
  metric: Record<string, string>
  data: ChartPoint[]
}

export const prometheusToRechartsMulti = (resp: PrometheusRangeResponse): RechartsSeries[] => {
  if (resp.status !== 'success' || !resp.data?.result) return []

  return resp.data.result.map((series, idx) => {
    const metric = series.metric || {}

    const id = metric.container || metric.pod || metric.instance || metric.job || `series_${idx}`

    const data: ChartPoint[] = series.values.map(([ts, v]) => ({
      timestamp: ts * 1000, // prom timestamp -> ms
      value: Number(v),
    }))

    return { id, metric, data }
  })
}
