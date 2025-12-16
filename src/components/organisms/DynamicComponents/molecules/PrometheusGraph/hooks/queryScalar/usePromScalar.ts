import { useQuery } from '@tanstack/react-query'
import { TPrometheusScalarResponse } from '../../types'

export const usePromScalar = ({
  baseUrl = 'http://localhost:9090/api/v1/',
  query,
  refetchInterval = 30000,
  enabled = true,
}: {
  baseUrl?: string
  query: string
  refetchInterval?: number | false
  enabled?: boolean
}) =>
  useQuery<TPrometheusScalarResponse, Error>({
    queryKey: ['prometheus', 'scalar', query],
    queryFn: async () => {
      const url = `${baseUrl}query?query=${encodeURIComponent(query)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Prometheus request failed: ${res.status}`)
      const json = (await res.json()) as TPrometheusScalarResponse

      // Optional safety: ensure this hook only accepts scalar responses
      if (json.status === 'success' && json.data?.resultType !== 'scalar') {
        throw new Error(`Expected scalar resultType, got: ${json.data?.resultType}`)
      }

      return json
    },
    enabled,
    refetchInterval,
  })
