import { useQuery } from '@tanstack/react-query'
import { getKinds } from 'api/bff/search/getKinds'
import { getSortedKindsAll } from 'utils/getSortedKindsAll'

export const useKinds = ({
  cluster,
  refetchInterval,
  isEnabled,
}: {
  cluster: string
  refetchInterval?: number | false
  isEnabled?: boolean
}) => {
  return useQuery({
    queryKey: ['useKinds', cluster],
    queryFn: () => getKinds({ cluster }),
    select: data => ({
      kindIndex: data.data,
      kindsWithVersion: getSortedKindsAll(data.data),
    }),
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 60_000,
    enabled: isEnabled,
  })
}
