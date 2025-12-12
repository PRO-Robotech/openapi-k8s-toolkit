import { TPrometheusVectorResponse } from '../types'
import { pickSeriesId } from '../helpers'

export type TRadialGaugeValue = {
  id: string
  value: number
  metric: Record<string, string>
}

export const vectorToGaugeRadial = (resp: TPrometheusVectorResponse): TRadialGaugeValue | null => {
  if (resp.status !== 'success' || !resp.data?.result?.length) return null

  const item = resp.data.result[0]
  const metric = item.metric || {}
  const [, v] = item.value || [0, '0']

  return {
    id: pickSeriesId(metric, 0),
    value: Number(v),
    metric,
  }
}
