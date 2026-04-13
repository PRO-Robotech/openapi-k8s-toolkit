import { useQuery } from '@tanstack/react-query'
import { getPlugins } from 'api/bff/plugins/getPlugins'

export const usePluginManifest = ({
  cluster,
  refetchInterval,
  isEnabled,
}: {
  cluster: string
  refetchInterval?: number | false
  isEnabled?: boolean
}) => {
  return useQuery({
    queryKey: ['usePluginManifest', cluster],
    queryFn: () => getPlugins({ cluster }),
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 60_000,
    enabled: isEnabled,
    // 🔴 Disable ALL auto refetching
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    // 🟢 Optional: Make data never go stale
    staleTime: Infinity,
  })
}
