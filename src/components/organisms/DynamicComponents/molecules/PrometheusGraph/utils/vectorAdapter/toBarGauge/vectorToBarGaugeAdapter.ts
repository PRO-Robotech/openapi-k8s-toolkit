import { TPrometheusVectorResponse } from '../../../types'
import { pickSeriesId } from '../helpers'

export type TBarGaugeItem = {
  id: string
  value: number
  metric: Record<string, string>
}

export const vectorToBarGauge = (resp: TPrometheusVectorResponse): TBarGaugeItem[] => {
  if (resp.status !== 'success' || !resp.data?.result) return []

  return resp.data.result
    .map((item, idx) => {
      const metric = item.metric || {}
      const [, v] = item.value || [0, '0']

      return {
        id: pickSeriesId(metric, idx),
        value: Number(v),
        metric,
      }
    })
    .sort((a, b) => b.value - a.value)
}
