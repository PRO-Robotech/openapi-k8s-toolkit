import React from 'react'
import { TActionUnion, TEditActionProps, TActionsPermissions } from '../../types/ActionsDropdown'
import { LabelsModal } from '../AggregatedCounterCard/molecules/LabelsModal'
import { AnnotationsModal } from '../AggregatedCounterCard/molecules/AnnotationsModal'
import { TaintsModal } from '../AggregatedCounterCard/molecules/TaintsModal'
import { TolerationsModal } from '../AggregatedCounterCard/molecules/TolerationsModal'
import { renderAntIcon } from '../AntdIcons/utils'
import { renderIcon as renderBase64Icon } from '../AggregatedCounterCard/utils'
import { Styled } from './styled'

type TModalExtraProps = {
  open: boolean
  onClose: () => void
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

export const renderActionModal = (action: TActionUnion, extraProps: TModalExtraProps): React.ReactNode => {
  switch (action.type) {
    case 'edit':
      return null

    case 'editLabels':
      return <LabelsModal {...action.props} {...extraProps} />

    case 'editAnnotations':
      return <AnnotationsModal {...action.props} {...extraProps} />

    case 'editTaints':
      return <TaintsModal {...action.props} {...extraProps} />

    case 'editTolerations':
      return <TolerationsModal {...action.props} {...extraProps} />

    case 'delete':
      // Delete modal is handled separately in ActionsDropdown component
      return null

    default: {
      // eslint-disable-next-line no-underscore-dangle
      const _exhaustive: never = action
      return _exhaustive
    }
  }
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

const isActionDisabledByPermission = (action: TActionUnion, permissions?: TActionsPermissions): boolean => {
  if (!permissions) return false

  switch (action.type) {
    case 'edit':
      return permissions.canUpdate === false
    case 'editLabels':
    case 'editAnnotations':
    case 'editTaints':
    case 'editTolerations':
      return permissions.canPatch === false
    case 'delete':
      return permissions.canDelete === false
    default:
      return false
  }
}

export const getMenuItems = (
  actions: TActionUnion[],
  onActionClick: (action: TActionUnion) => void,
  permissions?: TActionsPermissions,
) =>
  actions.map((action, index) => ({
    key: `${action.type}-${index}`,
    label: action.props.text,
    icon: getActionIcon(action),
    disabled: action.props.disabled || isActionDisabledByPermission(action, permissions),
    danger: action.props.danger,
    onClick: () => onActionClick(action),
  }))
