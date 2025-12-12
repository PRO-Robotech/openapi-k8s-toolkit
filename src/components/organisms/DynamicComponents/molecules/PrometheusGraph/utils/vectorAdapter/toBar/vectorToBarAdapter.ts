import { TPrometheusVectorResponse } from '../types'
import { pickSeriesId } from '../helpers'

// Generic "bar item" (works for both vertical & horizontal;
// you decide which key is X vs Y in your Recharts config)
export type TBarItem = {
  id: string
  metric: Record<string, string>
  timestamp?: number // ms (optional, but often handy)
  value: number
}

/**
 * Vertical bar: typically X = id (category), Y = value.
 * Return: [{ id, value, metric, timestamp? }, ...]
 */
export const vectorToBarVertical = (resp: TPrometheusVectorResponse): TBarItem[] => {
  if (resp?.status !== 'success' || !resp.data?.result?.length) return []

  return resp.data.result.map((item, idx) => {
    const metric = item.metric || {}
    const [ts, v] = item.value || [0, '0']

    return {
      id: pickSeriesId(metric, idx),
      metric,
      timestamp: ts * 1000,
      value: Number(v),
    }
  })
}

/**
 * Horizontal bar: often Y = id (category), X = value.
 * Data shape can be identical; the chart config swaps axes.
 * Return: [{ id, value, metric, timestamp? }, ...]
 */
export const vectorToBarHorizontal = (resp: TPrometheusVectorResponse): TBarItem[] => {
  if (resp?.status !== 'success' || !resp.data?.result?.length) return []

  return resp.data.result.map((item, idx) => {
    const metric = item.metric || {}
    const [ts, v] = item.value || [0, '0']

    return {
      id: pickSeriesId(metric, idx),
      metric,
      timestamp: ts * 1000,
      value: Number(v),
    }
  })
}
