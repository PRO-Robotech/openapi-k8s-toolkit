import { TPrometheusVectorResponse } from '../types'
import { pickSeriesId } from '../helpers'

export type TTableRow = {
  id: string
  value: number
  timestamp: number
  metric: Record<string, string>
}

export const vectorToTableRows = (resp: TPrometheusVectorResponse): TTableRow[] => {
  if (resp.status !== 'success' || !resp.data?.result) return []

  return resp.data.result.map((item, idx) => {
    const metric = item.metric || {}
    const [ts, v] = item.value || [0, '0']

    return {
      id: pickSeriesId(metric, idx),
      value: Number(v),
      timestamp: ts * 1000,
      metric,
    }
  })
}
