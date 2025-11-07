import { useQuery } from '@tanstack/react-query'
import { getBuiltinResourceTypes } from 'api/getBuiltinResourceTypes'
import { TBuiltinResourceTypeList } from 'localTypes/k8s'

/* /api/v1 */
export const useBuiltinResourceTypes = ({ clusterName }: { clusterName: string }) => {
  return useQuery({
    queryKey: ['useBuiltinResourceTypes', clusterName],
    queryFn: async () => {
      const response = await getBuiltinResourceTypes<TBuiltinResourceTypeList>({ clusterName })
      // Deep clone the data (to avoid mutating the original response)
      const data = JSON.parse(JSON.stringify(response.data))
      // Remove deeply nested field
      if (data.metadata?.resourceVersion) {
        delete data.metadata.resourceVersion
      }
      return data as TBuiltinResourceTypeList
    },
    refetchInterval: 5000,
  })
}
