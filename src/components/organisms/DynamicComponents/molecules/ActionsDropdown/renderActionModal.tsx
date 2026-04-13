import React from 'react'
import { TActionUnion } from '../../types/ActionsDropdown'
import { LabelsModal } from '../AggregatedCounterCard/molecules/LabelsModal'
import { AnnotationsModal } from '../AggregatedCounterCard/molecules/AnnotationsModal'
import { TaintsModal } from '../AggregatedCounterCard/molecules/TaintsModal'
import { TolerationsModal } from '../AggregatedCounterCard/molecules/TolerationsModal'
import { OpenKubeletConfigModal } from './modals/OpenKubeletConfigModal'
import { DownloadAsFilesModal } from './modals/DownloadAsFilesModal'

type TModalExtraProps = {
  open: boolean
  onClose: () => void
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
    case 'cordon':
    case 'uncordon':
    case 'suspend':
    case 'resume':
    case 'rolloutRestart':
    case 'evict':
      return null
    case 'openKubeletConfig':
      return <OpenKubeletConfigModal {...extraProps} props={action.props} />

    case 'scale':
    case 'triggerRun':
    case 'deleteChildren':
    case 'rerunLast':
    case 'drain':
    case 'rollback':
    case 'createFromFiles':
      return null

    case 'downloadAsFiles':
      return (
        <DownloadAsFilesModal
          {...extraProps}
          endpoint={action.props.endpoint}
          resourceKind={action.props.resourceKind}
          name={action.props.name}
        />
      )

    default: {
      // eslint-disable-next-line no-underscore-dangle
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}
