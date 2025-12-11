import { useQuery } from '@tanstack/react-query'
import { buildPrometheusRangeParams } from '../../../utils/buildPrometheusRangeParams'
import { matrixToLineSingle, TPrometheusRangeResponse, TChartPoint } from '../../../utils/matrixAdapater/toLine'

export const usePromMatrixToLineSingle = ({
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
  useQuery<TChartPoint[], Error>({
    queryKey: ['prometheus', 'single', query, range],
    queryFn: async () => {
      const { start, end, step } = buildPrometheusRangeParams(range)

      const url = `http://localhost:9090/api/v1/query_range?query=${encodeURIComponent(
        query,
      )}&start=${start}&end=${end}&step=${step}`

      const res = await fetch(url)

      if (!res.ok) throw new Error(`Prometheus request failed: ${res.status}`)

      const json: TPrometheusRangeResponse = await res.json()

      return matrixToLineSingle(json)
    },
    enabled,
    refetchInterval,
  })
