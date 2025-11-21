import { useQuery } from '@tanstack/react-query'
import { getCrdResources, getCrdResourceSingle } from 'api/getCrdResource'
import { TCrdResources, TSingleResource } from 'localTypes/k8s'
import { TJSON } from 'localTypes/JSON'

/* same as api resource */
export const useCrdResources = <T = TJSON[]>({
  cluster,
  namespace,
  apiGroup,
  apiVersion,
  crdName,
  refetchInterval,
  isEnabled,
}: {
  cluster: string
  namespace?: string
  apiGroup: string
  apiVersion: string
  crdName: string
  refetchInterval?: number | false
  isEnabled?: boolean
}) => {
  return useQuery({
    queryKey: ['useCrdResources', cluster, namespace, apiGroup, apiVersion, crdName],
    queryFn: async () => {
      const response = await getCrdResources<TCrdResources<T>>({
        cluster,
        namespace,
        apiGroup,
        apiVersion,
        crdName,
      })
      // Deep clone the data (to avoid mutating the original response)
      const data = JSON.parse(JSON.stringify(response.data))
      // Remove deeply nested field
      if (data.metadata?.resourceVersion) {
        delete data.metadata.resourceVersion
      }
      return data as TCrdResources<T>
    },
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 5000,
    enabled: isEnabled,
  })
}

/* same as api resource */
export const useCrdResourceSingle = ({
  cluster,
  namespace,
  apiGroup,
  apiVersion,
  crdName,
  name,
  refetchInterval,
}: {
  cluster: string
  namespace?: string
  apiGroup: string
  apiVersion: string
  crdName: string
  name: string
  refetchInterval?: number | false
}) => {
  return useQuery({
    queryKey: ['useCrdResourceSingle', cluster, namespace, apiGroup, apiVersion, crdName, name],
    queryFn: async () =>
      (
        await getCrdResourceSingle<TSingleResource>({
          cluster,
          namespace,
          apiGroup,
          apiVersion,
          crdName,
          name,
        })
      ).data,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 5000,
  })
}
