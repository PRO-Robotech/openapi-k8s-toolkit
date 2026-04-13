import { useQuery } from '@tanstack/react-query'
import { getClusterList } from 'api/getClusterList'

type TUseClusterListParams = {
  enabled?: boolean
  refetchInterval?: number | false
}

export const useClusterList = ({ enabled = true, refetchInterval }: TUseClusterListParams = {}) => {
  return useQuery({
    queryKey: ['useClusterList'],
    queryFn: async () => (await getClusterList()).data,
    enabled,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 5000,
  })
}
