// src/.../PrometheusGraph/hooks/usePrometheusQueryRange.ts
import { useQuery } from '@tanstack/react-query'
import { buildPrometheusRangeParams } from '../utils/prometheus'
import { prometheusToRechartsMulti, PrometheusRangeResponse, RechartsSeries } from '../utils/prometheusAdapter'

export const usePrometheusQueryRangeMulti = ({
  query,
  range = '1h',
  refetchInterval = 30000,
  enabled = true,
}: {
  query: string
  range?: string
  refetchInterval?: number | false
  enabled?: boolean
}) =>
  useQuery<RechartsSeries[], Error>({
    queryKey: ['prometheus', query, range],
    queryFn: async () => {
      const { start, end, step } = buildPrometheusRangeParams(range)

      const url = `http://localhost:9090/api/v1/query_range?query=${encodeURIComponent(
        query,
      )}&start=${start}&end=${end}&step=${step}`

      const res = await fetch(url)

      if (!res.ok) throw new Error(`Prometheus request failed: ${res.status}`)

      const json: PrometheusRangeResponse = await res.json()

      return prometheusToRechartsMulti(json)
    },
    enabled,
    refetchInterval,
  })
