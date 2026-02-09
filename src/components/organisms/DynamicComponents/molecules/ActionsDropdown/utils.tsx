import React from 'react'
import { Tooltip } from 'antd'
import type { TPermissionVerb } from 'localTypes/permissions'
import { parseAll } from '../utils'
import { TActionUnion, TEditActionProps, TActionsPermissions } from '../../types/ActionsDropdown'
import { renderAntIcon } from '../AntdIcons/utils'
import { renderIcon as renderBase64Icon } from '../AggregatedCounterCard/utils'
import { Styled } from './styled'

type TVisibilityContext = {
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
}

export type TRequiredPermission = {
  verb: TPermissionVerb
  subresource?: string
}

const ACTION_REQUIRED_PERMISSIONS: Record<TActionUnion['type'], TRequiredPermission | TRequiredPermission[]> = {
  edit: { verb: 'update' },
  editLabels: { verb: 'patch' },
  editAnnotations: { verb: 'patch' },
  editTaints: { verb: 'patch' },
  editTolerations: { verb: 'patch' },
  delete: { verb: 'delete' },
  cordon: { verb: 'patch' },
  uncordon: { verb: 'patch' },
  suspend: { verb: 'patch' },
  resume: { verb: 'patch' },
  rolloutRestart: { verb: 'patch' },
  evict: { verb: 'create', subresource: 'eviction' },
  openKubeletConfig: { verb: 'get', subresource: 'proxy' },
}

const toArray = <T,>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value])

export const getRequiredPermissions = (actions: TActionUnion[]): TRequiredPermission[] => {
  return actions.flatMap(action => toArray(ACTION_REQUIRED_PERMISSIONS[action.type]))
}

const UNDEFINED_FALLBACK = 'Undefined with no fallback'
const isMeaningfulValue = (value: string): boolean => value.length > 0 && value !== '-' && value !== UNDEFINED_FALLBACK

export const getVisibleActions = (
  actions: TActionUnion[],
  { replaceValues, multiQueryData }: TVisibilityContext,
): TActionUnion[] => {
  return actions.filter(action => {
    const condition = action.props.visibleWhen

    if (!condition) return true

    const currentValue = parseAll({ text: condition.value, replaceValues, multiQueryData })
    const hasValue = isMeaningfulValue(currentValue)

    if (condition.criteria === 'exists') {
      return hasValue
    }

    if (condition.criteria === 'notExists') {
      return !hasValue
    }

    if (condition.valueToCompare === undefined) {
      return true
    }

    const expectedValues = (
      Array.isArray(condition.valueToCompare) ? condition.valueToCompare : [condition.valueToCompare]
    ).map(value => parseAll({ text: value, replaceValues, multiQueryData }))
    const matches = expectedValues.includes(currentValue)

    return condition.criteria === 'equals' ? matches : !matches
  })
}

export const buildEditUrl = (props: TEditActionProps, fullPath: string): string => {
  const { cluster, namespace, syntheticProject, apiGroup, apiVersion, plural, name, baseprefix = '' } = props

  const pathPrefix = !apiGroup || apiGroup.length === 0 ? 'forms/builtin' : 'forms/apis'
  const apiGroupAndVersion = !apiGroup || apiGroup.length === 0 ? apiVersion : `${apiGroup}/${apiVersion}`
  const backlink = encodeURIComponent(fullPath)

  const parts = [
    baseprefix.replace(/^\//, ''),
    cluster,
    namespace,
    syntheticProject,
    pathPrefix,
    apiGroupAndVersion,
    plural,
    name,
  ].filter(Boolean)

  return `/${parts.join('/')}?backlink=${backlink}`
}

const getActionIcon = (action: TActionUnion): React.ReactNode => {
  if (action.props.iconBase64Encoded) {
    return (
      <Styled.IconWrapper>
        <Styled.IconScaler>{renderBase64Icon(action.props.iconBase64Encoded, 'currentColor')}</Styled.IconScaler>
      </Styled.IconWrapper>
    )
  }
  if (action.props.icon) {
    return renderAntIcon(action.props.icon)
  }
  return undefined
}

const isActionDisabledByPermission = (action: TActionUnion, permissions: TActionsPermissions): boolean => {
  switch (action.type) {
    case 'edit':
      return permissions.canUpdate !== true
    case 'editLabels':
    case 'editAnnotations':
    case 'editTaints':
    case 'editTolerations':
    case 'cordon':
    case 'uncordon':
    case 'suspend':
    case 'resume':
    case 'rolloutRestart':
      return permissions.canPatch !== true
    case 'delete':
      return permissions.canDelete !== true
    case 'evict':
      return permissions.canCreate !== true
    case 'openKubeletConfig':
      return permissions.canGet !== true
    default:
      return true
  }
}

export const getMenuItems = (
  actions: TActionUnion[],
  onActionClick: (action: TActionUnion) => void,
  permissions: TActionsPermissions,
) =>
  actions.map((action, index) => ({
    key: `${action.type}-${index}`,
    label: action.props.tooltip ? (
      <Tooltip title={action.props.tooltip}>
        <span>{action.props.text}</span>
      </Tooltip>
    ) : (
      action.props.text
    ),
    icon: getActionIcon(action),
    disabled: action.props.disabled || isActionDisabledByPermission(action, permissions),
    danger: action.props.danger,
    onClick: () => onActionClick(action),
  }))
