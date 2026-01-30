import React from 'react'
import { TActionUnion, TEditActionProps } from '../../types/ActionsDropdown'
import { LabelsModal } from '../AggregatedCounterCard/molecules/LabelsModal'
import { AnnotationsModal } from '../AggregatedCounterCard/molecules/AnnotationsModal'
import { TaintsModal } from '../AggregatedCounterCard/molecules/TaintsModal'
import { TolerationsModal } from '../AggregatedCounterCard/molecules/TolerationsModal'
import { renderAntIcon } from '../AntdIcons/utils'

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

    default: {
      // eslint-disable-next-line no-underscore-dangle
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

export const getMenuItems = (actions: TActionUnion[], onActionClick: (action: TActionUnion) => void) =>
  actions.map((action, index) => ({
    key: `${action.type}-${index}`,
    label: action.props.text,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: action.props.icon ? renderAntIcon(action.props.icon as any) : undefined,
    disabled: action.props.disabled,
    danger: action.props.danger,
    onClick: () => onActionClick(action),
  }))
