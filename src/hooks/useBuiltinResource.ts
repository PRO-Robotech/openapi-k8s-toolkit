import { useQuery } from '@tanstack/react-query'
import { getBuiltinResources, getBuiltinResourceSingle } from 'api/getBuiltinResource'
import { TBuiltinResources, TSingleResource } from '../localTypes/k8s'

export const useBuiltinResources = ({
  cluster,
  namespace,
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
  plural: string
  name?: string
  labels?: string[]
  fields?: string[]
  limit: string | null
  refetchInterval?: number | false
  isEnabled?: boolean
}) => {
  return useQuery({
    queryKey: ['useBuiltinResourceType', cluster, namespace, plural, name, labels, fields, limit],
    queryFn: async () => {
      const response = await getBuiltinResources<TBuiltinResources>({
        cluster,
        namespace,
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
      return data as TBuiltinResources
    },
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 5000,
    enabled: isEnabled,
  })
}

export const useBuiltinResourceSingle = ({
  cluster,
  namespace,
  plural,
  name,
  refetchInterval,
}: {
  cluster: string
  namespace?: string
  plural: string
  name: string
  refetchInterval?: number | false
}) => {
  return useQuery({
    queryKey: ['useBuiltinResourceSingle', cluster, namespace, plural, name],
    queryFn: async () => (await getBuiltinResourceSingle<TSingleResource>({ cluster, namespace, plural, name })).data,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 5000,
  })
}
