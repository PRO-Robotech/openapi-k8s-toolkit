import { useQuery } from '@tanstack/react-query'
import { getKindsRaw } from 'api/bff/search/getKindsRaw'
import { getSortedKindsAll } from 'utils/getSortedKindsAll'

export const useKindsRaw = ({
  cluster,
  refetchInterval,
  isEnabled,
}: {
  cluster: string
  refetchInterval?: number | false
  isEnabled?: boolean
}) => {
  return useQuery({
    queryKey: ['useKindsRaw', cluster],
    queryFn: () => getKindsRaw({ cluster }),
    select: data => ({
      kindIndex: data.data,
      kindsWithVersion: getSortedKindsAll(data.data),
    }),
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 60_000,
    enabled: isEnabled,
  })
}
