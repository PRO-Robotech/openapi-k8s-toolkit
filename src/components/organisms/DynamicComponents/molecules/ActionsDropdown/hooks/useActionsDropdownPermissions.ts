import { useMemo } from 'react'
import { usePermissions } from 'hooks/usePermissions'
import type { TPermissionVerb } from 'localTypes/permissions'
import { parseAll } from '../../utils'
import type { TActionUnion, TActionsPermissions, TPermissionContext } from '../../../types/ActionsDropdown'
import { ACTION_REQUIRED_PERMISSIONS } from '../permissionsMap'

type TPermissionSlot = {
  cluster: string
  namespace?: string
  apiGroup?: string
  plural: string
  subresource?: string
  verb: TPermissionVerb
  cacheKey: string
}

type TParseContext = {
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
}

const buildCacheKey = (slot: Omit<TPermissionSlot, 'cacheKey'>): string =>
  `${slot.cluster}|${slot.namespace ?? ''}|${slot.apiGroup ?? ''}|${slot.plural}|${slot.subresource ?? ''}|${slot.verb}`

const parsePermissionContext = (
  ctx: TPermissionContext,
  parseCtx: TParseContext,
): { cluster: string; namespace?: string; apiGroup?: string; plural: string; subresource?: string } => ({
  cluster: parseAll({ text: ctx.cluster, ...parseCtx }),
  namespace: ctx.namespace ? parseAll({ text: ctx.namespace, ...parseCtx }) : undefined,
  apiGroup: ctx.apiGroup ? parseAll({ text: ctx.apiGroup, ...parseCtx }) : undefined,
  plural: parseAll({ text: ctx.plural, ...parseCtx }),
  subresource: ctx.subresource ? parseAll({ text: ctx.subresource, ...parseCtx }) : undefined,
})

const isValidContext = (parsed: { cluster: string; plural: string }): boolean =>
  !!parsed.cluster && parsed.cluster !== '-' && !!parsed.plural && parsed.plural !== '-'

type TUseActionsDropdownPermissionsParams = {
  actions: TActionUnion[]
  permissions?: TActionsPermissions
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
  isMultiQueryLoading: boolean
}

type TActionSlotMapping = {
  actionKey: string
  slotIndex: number
}

const useManyPermissions = (slots: TPermissionSlot[], enabled: boolean) => {
  const results: ReturnType<typeof usePermissions>[] = []

  // rules-of-hooks safe: fixed loop count, no conditional exits.
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[i] = usePermissions({
      cluster: slot.cluster,
      namespace: slot.namespace,
      apiGroup: slot.apiGroup,
      plural: slot.plural,
      subresource: slot.subresource,
      verb: slot.verb,
      refetchInterval: false,
      enabler: enabled,
    })
  }

  return results
}

export const useActionsDropdownPermissions = ({
  actions,
  permissions,
  replaceValues,
  multiQueryData,
  isMultiQueryLoading,
}: TUseActionsDropdownPermissionsParams): TActionsPermissions => {
  const shouldCheckPermissions = !permissions

  const { slots, mappings } = useMemo(() => {
    if (!shouldCheckPermissions || isMultiQueryLoading) {
      return {
        slots: [] as TPermissionSlot[],
        mappings: [] as TActionSlotMapping[],
      }
    }

    const parseCtx: TParseContext = { replaceValues, multiQueryData }
    const uniqueSlots: TPermissionSlot[] = []
    const cacheKeyToIndex = new Map<string, number>()
    const actionMappings: TActionSlotMapping[] = []

    actions.forEach((action, index) => {
      const actionKey = `${action.type}-${index}`
      const permCtx = action.props.permissionContext

      if (!permCtx) {
        return
      }

      const parsed = parsePermissionContext(permCtx, parseCtx)
      if (!isValidContext(parsed)) {
        return
      }

      const requiredPerm = ACTION_REQUIRED_PERMISSIONS[action.type]
      const subresource = requiredPerm.subresource ?? parsed.subresource

      const slotData = {
        cluster: parsed.cluster,
        namespace: parsed.namespace,
        apiGroup: parsed.apiGroup,
        plural: parsed.plural,
        subresource,
        verb: requiredPerm.verb,
      }
      const cacheKey = buildCacheKey(slotData)

      let slotIndex = cacheKeyToIndex.get(cacheKey)
      if (slotIndex === undefined) {
        slotIndex = uniqueSlots.length
        uniqueSlots.push({ ...slotData, cacheKey })
        cacheKeyToIndex.set(cacheKey, slotIndex)
      }

      actionMappings.push({ actionKey, slotIndex })
    })

    return { slots: uniqueSlots, mappings: actionMappings }
  }, [shouldCheckPermissions, isMultiQueryLoading, actions, replaceValues, multiQueryData])

  const enabled = shouldCheckPermissions && !isMultiQueryLoading

  const slotResults = useManyPermissions(slots, enabled)

  if (permissions) {
    return permissions
  }

  const computed: TActionsPermissions = {}

  mappings.forEach(mapping => {
    const result = slotResults[mapping.slotIndex]
    computed[mapping.actionKey] = result?.data?.status?.allowed
  })

  return computed
}
