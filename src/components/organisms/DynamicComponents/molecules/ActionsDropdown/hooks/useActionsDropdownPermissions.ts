import { useEffect, useMemo } from 'react'
import { usePermissions } from 'hooks/usePermissions'
import type { TPermissionVerb } from 'localTypes/permissions'
import { parseAll } from '../../utils'
import type { TActionUnion, TActionsPermissions, TPermissionContext } from '../../../types/ActionsDropdown'
import { ACTION_REQUIRED_PERMISSIONS } from '../permissionsMap'

const MAX_PERMISSION_SLOTS = 10

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

const usePermissionSlot = (slot: TPermissionSlot | undefined, enabled: boolean) => {
  return usePermissions({
    cluster: slot?.cluster ?? '',
    namespace: slot?.namespace,
    apiGroup: slot?.apiGroup,
    plural: slot?.plural ?? '',
    subresource: slot?.subresource,
    verb: slot?.verb ?? 'get',
    refetchInterval: false,
    enabler: enabled && !!slot,
  })
}

export const useActionsDropdownPermissions = ({
  actions,
  permissions,
  replaceValues,
  multiQueryData,
  isMultiQueryLoading,
}: TUseActionsDropdownPermissionsParams): TActionsPermissions => {
  const shouldCheckPermissions = !permissions

  const { slots, mappings, truncatedActionsCount } = useMemo(() => {
    if (!shouldCheckPermissions || isMultiQueryLoading) {
      return {
        slots: [] as TPermissionSlot[],
        mappings: [] as TActionSlotMapping[],
        truncatedActionsCount: 0,
      }
    }

    const parseCtx: TParseContext = { replaceValues, multiQueryData }
    const uniqueSlots: TPermissionSlot[] = []
    const cacheKeyToIndex = new Map<string, number>()
    const actionMappings: TActionSlotMapping[] = []
    let truncated = 0

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
        if (uniqueSlots.length >= MAX_PERMISSION_SLOTS) {
          truncated += 1
          return
        }
        slotIndex = uniqueSlots.length
        uniqueSlots.push({ ...slotData, cacheKey })
        cacheKeyToIndex.set(cacheKey, slotIndex)
      }

      actionMappings.push({ actionKey, slotIndex })
    })

    return { slots: uniqueSlots, mappings: actionMappings, truncatedActionsCount: truncated }
  }, [shouldCheckPermissions, isMultiQueryLoading, actions, replaceValues, multiQueryData])

  const enabled = shouldCheckPermissions && !isMultiQueryLoading

  // Fixed-slot hook calls — must always be called in the same order
  const result0 = usePermissionSlot(slots[0], enabled && slots.length > 0)
  const result1 = usePermissionSlot(slots[1], enabled && slots.length > 1)
  const result2 = usePermissionSlot(slots[2], enabled && slots.length > 2)
  const result3 = usePermissionSlot(slots[3], enabled && slots.length > 3)
  const result4 = usePermissionSlot(slots[4], enabled && slots.length > 4)
  const result5 = usePermissionSlot(slots[5], enabled && slots.length > 5)
  const result6 = usePermissionSlot(slots[6], enabled && slots.length > 6)
  const result7 = usePermissionSlot(slots[7], enabled && slots.length > 7)
  const result8 = usePermissionSlot(slots[8], enabled && slots.length > 8)
  const result9 = usePermissionSlot(slots[9], enabled && slots.length > 9)

  const slotResults = [result0, result1, result2, result3, result4, result5, result6, result7, result8, result9]

  useEffect(() => {
    if (truncatedActionsCount > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[ActionsDropdown] Permission slot limit (${MAX_PERMISSION_SLOTS}) reached; ${truncatedActionsCount} action(s) permission checks were skipped.`,
      )
    }
  }, [truncatedActionsCount])

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
