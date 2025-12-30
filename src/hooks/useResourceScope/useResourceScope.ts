import { useQuery } from '@tanstack/react-query'
import { checkIfApiInstanceNamespaceScoped, checkIfBuiltInInstanceNamespaceScoped } from 'api/bff/scopes/checkScopes'

type TUseResourceScopeArgs = {
  cluster: string
  apiGroup?: string
  apiVersion?: string
  plural: string
}

type TUseResourceScopeRes = {
  isClusterWide: boolean
  isNamespaceScoped: boolean
}

export const useResourceScope = ({ plural, cluster, apiGroup, apiVersion }: TUseResourceScopeArgs) => {
  const computedResourceType: 'builtin' | 'api' = apiGroup ? 'api' : 'builtin'

  const enabled = Boolean(cluster) && Boolean(plural) && (computedResourceType === 'builtin' || Boolean(apiVersion))

  return useQuery<TUseResourceScopeRes>({
    queryKey: ['resource-scope', computedResourceType, cluster, plural, apiGroup, apiVersion],
    enabled,
    queryFn: async () => {
      if (computedResourceType === 'builtin') {
        return checkIfBuiltInInstanceNamespaceScoped({ plural, cluster })
      }

      return checkIfApiInstanceNamespaceScoped({
        plural,
        apiGroup: apiGroup || '',
        apiVersion: apiVersion || '',
        cluster,
      })
    },
    staleTime: 5 * 60 * 1000,
  })
}
