import React from 'react'
import { Tooltip } from 'antd'
import { parseAll } from '../utils'
import { TActionUnion, TEditActionProps, TActionsPermissions } from '../../types/ActionsDropdown'
import { renderAntIcon } from '../AntdIcons/utils'
import { renderIcon as renderBase64Icon } from '../AggregatedCounterCard/utils'
import { ACTION_REQUIRED_PERMISSIONS, TRequiredPermission } from './permissionsMap'
import { Styled } from './styled'

type TVisibilityContext = {
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
}

export const getRequiredPermissions = (actions: TActionUnion[]): TRequiredPermission[] => {
  return actions.map(action => ACTION_REQUIRED_PERMISSIONS[action.type])
}

const UNDEFINED_FALLBACK = 'Undefined with no fallback'
const isMeaningfulValue = (value: string): boolean => value.length > 0 && value !== '-' && value !== UNDEFINED_FALLBACK

export const getVisibleActions = (
  actions: TActionUnion[],
  { replaceValues, multiQueryData }: TVisibilityContext,
): { action: TActionUnion; actionKey: string }[] => {
  return actions.flatMap((action, index) => {
    const condition = action.props.visibleWhen

    if (!condition) {
      return [{ action, actionKey: `${action.type}-${index}` }]
    }

    const currentValue = parseAll({ text: condition.value, replaceValues, multiQueryData })
    const hasValue = isMeaningfulValue(currentValue)

    if (condition.criteria === 'exists') {
      return hasValue ? [{ action, actionKey: `${action.type}-${index}` }] : []
    }

    if (condition.criteria === 'notExists') {
      return !hasValue ? [{ action, actionKey: `${action.type}-${index}` }] : []
    }

    if (condition.valueToCompare === undefined) {
      return [{ action, actionKey: `${action.type}-${index}` }]
    }

    const expectedValues = (
      Array.isArray(condition.valueToCompare) ? condition.valueToCompare : [condition.valueToCompare]
    ).map(value => parseAll({ text: value, replaceValues, multiQueryData }))
    const matches = expectedValues.includes(currentValue)

    const isVisible = condition.criteria === 'equals' ? matches : !matches
    return isVisible ? [{ action, actionKey: `${action.type}-${index}` }] : []
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

const isActionDisabledByPermission = (actionKey: string, permissions: TActionsPermissions): boolean => {
  return permissions[actionKey] !== true
}

export const getMenuItems = (
  visibleActions: { action: TActionUnion; actionKey: string }[],
  onActionClick: (action: TActionUnion) => void,
  permissions: TActionsPermissions,
) =>
  visibleActions.map(({ action, actionKey }) => ({
    key: actionKey,
    label: action.props.tooltip ? (
      <Tooltip title={action.props.tooltip}>
        <span>{action.props.text}</span>
      </Tooltip>
    ) : (
      action.props.text
    ),
    icon: getActionIcon(action),
    disabled: action.props.disabled || isActionDisabledByPermission(actionKey, permissions),
    danger: action.props.danger,
    onClick: () => {
      console.log('[ActionsDropdown] menu item clicked, actionKey:', actionKey, 'type:', action.type, 'disabled:', action.props.disabled)
      onActionClick(action)
    },
  }))
