import { useQuery } from '@tanstack/react-query'
import { checkPermission } from 'api/permissions'
import type { TPermissionVerb } from 'localTypes/permissions'

export const usePermissions = ({
  cluster,
  namespace,
  apiGroup,
  plural,
  verb,
  name,
  refetchInterval,
  enabler,
}: {
  cluster: string
  apiGroup?: string
  plural: string
  namespace?: string
  name?: string
  verb: TPermissionVerb
  refetchInterval?: number | false
  enabler?: boolean
}) => {
  return useQuery({
    queryKey: ['usePermissions', cluster, namespace, apiGroup, plural, verb, name],
    queryFn: async () =>
      (
        await checkPermission({
          cluster,
          body: {
            namespace,
            apiGroup,
            plural,
            verb,
          },
        })
      ).data,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : 5000,
    enabled: enabler ?? true,
  })
}
