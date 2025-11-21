import { useQuery } from '@tanstack/react-query'
import { getApiResources, getApiResourceSingle } from 'api/getApiResource'
import { TApiResources, TSingleResource } from 'localTypes/k8s'

export const useApiResources = ({
  cluster,
  namespace,
  apiGroup,
  apiVersion,
  plural,
  name,
  labels,
  fields,
  limit,
  refetchInterval,
  isEnabled,
}: {
  cluster: string
  namespace?: string
  apiGroup: string
  apiVersion: string
  plural: string
  name?: string
  labels?: string[]
  fields?: string[]
  limit: string | null
  refetchInterval?: number | false
  isEnabled?: boolean
}) => {
  return useQuery({
    queryKey: ['useApiResources', cluster, namespace, apiGroup, apiVersion, plural, name, labels, fields, limit],
    queryFn: async () => {
      const response = await getApiResources<TApiResources>({
        cluster,
        namespace,
        apiGroup,
        apiVersion,
        plural,
        name,
        labels,
        fields,
        limit,
      })
      // Deep clone the data (to avoid mutating the original response)
      const data = JSON.parse(JSON.stringify(response.data))
      // Remove deeply nested field
      if (data.metadata?.resourceVersion) {
        delete data.metadata.resourceVersion
      }
      return data as TApiResources
    },
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 5000,
    enabled: isEnabled,
  })
}

export const useApiResourceSingle = ({
  cluster,
  namespace,
  apiGroup,
  apiVersion,
  plural,
  name,
  refetchInterval,
}: {
  cluster: string
  namespace?: string
  apiGroup: string
  apiVersion: string
  plural: string
  name: string
  refetchInterval?: number | false
}) => {
  return useQuery({
    queryKey: ['useApiResourceSingle', cluster, namespace, apiGroup, apiVersion, plural, name],
    queryFn: async () =>
      (
        await getApiResourceSingle<TSingleResource>({
          cluster,
          namespace,
          apiGroup,
          apiVersion,
          plural,
          name,
        })
      ).data,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 5000,
  })
}
