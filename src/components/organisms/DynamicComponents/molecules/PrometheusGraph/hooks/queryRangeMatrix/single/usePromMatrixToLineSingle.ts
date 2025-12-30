import { useQuery } from '@tanstack/react-query'
import { buildPrometheusRangeParams } from '../../../utils/buildPrometheusRangeParams'
import { TPrometheusRangeResponse } from '../../../types'
import { matrixToLineSingle, TChartPoint } from '../../../utils/matrixAdapter/toLine'

export const usePromMatrixToLineSingle = ({
  baseUrl = 'http://localhost:9090/api/v1/',
  query,
  range = '1h',
  refetchInterval = 30000,
  enabled = true,
}: {
  baseUrl?: string
  query: string
  range?: string
  refetchInterval?: number | false
  enabled?: boolean
}) =>
  useQuery<TChartPoint[], Error>({
    queryKey: ['prometheus', 'single', query, range],
    queryFn: async () => {
      const { start, end, step } = buildPrometheusRangeParams(range)

      const url = `${baseUrl}query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${step}`

      const res = await fetch(url)

      if (!res.ok) {
        throw new Error(`Prometheus request failed: ${res.status}`)
      }

      const json: TPrometheusRangeResponse = await res.json()

      return matrixToLineSingle(json)
    },
    enabled,
    refetchInterval,
  })
