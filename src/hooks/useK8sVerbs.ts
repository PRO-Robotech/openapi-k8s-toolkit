import { useDirectUnknownResource } from './useDirectUnknownResource'

type K8sVerbsResponse = {
  kind: string
  namespaced: boolean
  categories?: string[]
  verbs: string[]
}

export const useK8sVerbs = ({
  cluster,
  group,
  version,
  plural,
  isEnabled = true,
}: {
  cluster: string
  group?: string
  version: string
  plural: string
  isEnabled?: boolean
}) => {
  const uri = `/api/clusters/${cluster}/openapi-bff/verbs/getResourceVerbs?${new URLSearchParams({
    ...(group ? { group } : {}),
    version,
    plural,
  }).toString()}`

  const { data, isError, isLoading, error } = useDirectUnknownResource<K8sVerbsResponse>({
    uri,
    queryKey: ['k8s-verbs', group || '', version, plural],
    refetchInterval: false,
    isEnabled,
  })

  const verbs = data?.verbs || []
  const canList = verbs.includes('list')
  const canWatch = verbs.includes('watch')

  return {
    canList,
    canWatch,
    isError,
    isLoading,
    error,
  }
}
