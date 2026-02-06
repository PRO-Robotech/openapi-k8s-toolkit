import { usePermissions } from 'hooks/usePermissions'
import { parseAll } from '../../utils'
import { getRequiredPermissions } from '../utils'
import type { TActionUnion, TActionsPermissions, TPermissionContext } from '../../../types/ActionsDropdown'

type TUseActionsDropdownPermissionsParams = {
  actions: TActionUnion[]
  permissions?: TActionsPermissions
  permissionContext?: TPermissionContext
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
  isMultiQueryLoading: boolean
}

export const useActionsDropdownPermissions = ({
  actions,
  permissions,
  permissionContext,
  replaceValues,
  multiQueryData,
  isMultiQueryLoading,
}: TUseActionsDropdownPermissionsParams): TActionsPermissions => {
  const permissionContextPrepared = permissionContext
    ? {
        cluster: parseAll({ text: permissionContext.cluster, replaceValues, multiQueryData }),
        namespace: permissionContext.namespace
          ? parseAll({ text: permissionContext.namespace, replaceValues, multiQueryData })
          : undefined,
        apiGroup: permissionContext.apiGroup
          ? parseAll({ text: permissionContext.apiGroup, replaceValues, multiQueryData })
          : undefined,
        plural: parseAll({ text: permissionContext.plural, replaceValues, multiQueryData }),
        subresource: permissionContext.subresource
          ? parseAll({ text: permissionContext.subresource, replaceValues, multiQueryData })
          : undefined,
      }
    : undefined

  const isPermissionContextValid =
    !!permissionContextPrepared &&
    !isMultiQueryLoading &&
    !!permissionContextPrepared.cluster &&
    permissionContextPrepared.cluster !== '-' &&
    !!permissionContextPrepared.plural &&
    permissionContextPrepared.plural !== '-'

  const shouldCheckPermissions = !permissions
  const requiredPermissions = shouldCheckPermissions ? getRequiredPermissions(actions) : []
  const requiredVerbs = new Set(requiredPermissions.map(permission => permission.verb))

  const permissionBaseParams = {
    cluster: permissionContextPrepared?.cluster || '',
    namespace: permissionContextPrepared?.namespace,
    apiGroup: permissionContextPrepared?.apiGroup,
    plural: permissionContextPrepared?.plural || '',
    subresource: permissionContextPrepared?.subresource,
    refetchInterval: false as const,
  }

  const updatePermission = usePermissions({
    ...permissionBaseParams,
    verb: 'update',
    enabler: shouldCheckPermissions && isPermissionContextValid && requiredVerbs.has('update'),
  })
  const patchPermission = usePermissions({
    ...permissionBaseParams,
    verb: 'patch',
    enabler: shouldCheckPermissions && isPermissionContextValid && requiredVerbs.has('patch'),
  })
  const deletePermission = usePermissions({
    ...permissionBaseParams,
    verb: 'delete',
    enabler: shouldCheckPermissions && isPermissionContextValid && requiredVerbs.has('delete'),
  })
  const createPermission = usePermissions({
    ...permissionBaseParams,
    verb: 'create',
    enabler: shouldCheckPermissions && isPermissionContextValid && requiredVerbs.has('create'),
  })
  const getPermission = usePermissions({
    ...permissionBaseParams,
    verb: 'get',
    enabler: shouldCheckPermissions && isPermissionContextValid && requiredVerbs.has('get'),
  })

  const computedPermissions: TActionsPermissions = {
    canUpdate: requiredVerbs.has('update') ? updatePermission.data?.status.allowed : undefined,
    canPatch: requiredVerbs.has('patch') ? patchPermission.data?.status.allowed : undefined,
    canDelete: requiredVerbs.has('delete') ? deletePermission.data?.status.allowed : undefined,
    canCreate: requiredVerbs.has('create') ? createPermission.data?.status.allowed : undefined,
    canGet: requiredVerbs.has('get') ? getPermission.data?.status.allowed : undefined,
  }

  return permissions ?? computedPermissions
}
