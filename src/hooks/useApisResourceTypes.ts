import { useQuery } from '@tanstack/react-query'
import { getApiResourceTypes, getApiResourceTypesByApiGroup } from 'api/getApiResourceTypes'
import { TApiGroupList, TApiGroupResourceTypeList } from 'localTypes/k8s'

/* /apis/ */
export const useApisResourceTypes = ({ cluster }: { cluster: string }) => {
  return useQuery({
    queryKey: ['useApisResourceTypes', cluster],
    queryFn: async () => {
      const response = await getApiResourceTypes<TApiGroupList>({ cluster })
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
  cluster,
  apiGroup,
  apiVersion,
}: {
  cluster: string
  apiGroup: string
  apiVersion: string
}) => {
  return useQuery({
    queryKey: ['useApiResourceTypesByGroup', cluster, apiGroup, apiVersion],
    queryFn: async () => {
      const response = await getApiResourceTypesByApiGroup<TApiGroupResourceTypeList>({
        cluster,
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
