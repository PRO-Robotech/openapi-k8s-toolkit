import { TPrometheusVectorResponse } from '../../../types'
import { pickSeriesId } from '../helpers'

export type TPieSlice = {
  id: string
  value: number
  metric: Record<string, string>
}

export const vectorToPie = (resp: TPrometheusVectorResponse): TPieSlice[] => {
  if (resp.status !== 'success' || !resp.data?.result) return []

  return resp.data.result.map((item, idx) => {
    const metric = item.metric || {}
    const [, v] = item.value || [0, '0']

    return {
      id: pickSeriesId(metric, idx),
      value: Number(v),
      metric,
    }
  })
}
