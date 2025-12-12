import { useQuery } from '@tanstack/react-query'
import { TPrometheusVectorResponse } from '../../utils/vectorAdapter'

export const usePromVector = ({
  query,
  refetchInterval = 30000,
  enabled = true,
}: {
  query: string
  refetchInterval?: number | false
  enabled?: boolean
}) =>
  useQuery<TPrometheusVectorResponse, Error>({
    queryKey: ['prometheus', 'vector', query],
    queryFn: async () => {
      const url = `http://localhost:9090/api/v1/query?query=${encodeURIComponent(query)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Prometheus request failed: ${res.status}`)
      return (await res.json()) as TPrometheusVectorResponse
    },
    enabled,
    refetchInterval,
  })
