import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getDirectUnknownResource } from 'api/getDirectUnknownResource'

export const useDirectUnknownResource = <T>({
  uri,
  queryKey,
  refetchInterval,
  staleTime,
  isEnabled,
}: {
  uri: string
  queryKey: string[]
  refetchInterval?: number | false
  staleTime?: number
  isEnabled?: boolean
}): UseQueryResult<T, Error> => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getDirectUnknownResource<T>({
        uri,
      })
      // Deep clone the data (to avoid mutating the original response)
      const data = JSON.parse(JSON.stringify(response.data))
      // Remove deeply nested field
      if (data.metadata?.resourceVersion) {
        delete data.metadata.resourceVersion
      }
      return data as T
    },
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 5000,
    staleTime,
    enabled: isEnabled,
  })
}
