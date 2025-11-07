import { useQuery } from '@tanstack/react-query'
import { getApiResourceTypes, getApiResourceTypesByApiGroup } from 'api/getApiResourceTypes'
import { TApiGroupList, TApiGroupResourceTypeList } from 'localTypes/k8s'

/* /apis/ */
export const useApisResourceTypes = ({ clusterName }: { clusterName: string }) => {
  return useQuery({
    queryKey: ['useApisResourceTypes', clusterName],
    queryFn: async () => {
      const response = await getApiResourceTypes<TApiGroupList>({ clusterName })
      // Deep clone the data (to avoid mutating the original response)
      const data = JSON.parse(JSON.stringify(response.data))
      // Remove deeply nested field
      if (data.metadata?.resourceVersion) {
        delete data.metadata.resourceVersion
      }
      return data as TApiGroupList
    },
    refetchInterval: 5000,
  })
}

/* /apis/${apiGroup}/${apiVersion}/ */
export const useApiResourceTypesByGroup = ({
  clusterName,
  apiGroup,
  apiVersion,
}: {
  clusterName: string
  apiGroup: string
  apiVersion: string
}) => {
  return useQuery({
    queryKey: ['useApiResourceTypesByGroup', clusterName, apiGroup, apiVersion],
    queryFn: async () => {
      const response = await getApiResourceTypesByApiGroup<TApiGroupResourceTypeList>({
        clusterName,
        apiGroup,
        apiVersion,
      })
      // Deep clone the data (to avoid mutating the original response)
      const data = JSON.parse(JSON.stringify(response.data))
      // Remove deeply nested field
      if (data.metadata?.resourceVersion) {
        delete data.metadata.resourceVersion
      }
      return data as TApiGroupResourceTypeList
    },
    refetchInterval: 5000,
  })
}
