/* eslint-disable no-underscore-dangle */
import { TActiveTypeUnion } from '../../types/AggregatedCounterCard'
import { LabelsModal, AnnotationsModal, TaintsModal, TolerationsModal, EnrichedTableModal } from './molecules'

type TCommonExtraProps = {
  open: boolean
  onClose: () => void
}

export const renderActiveType = (activeType: TActiveTypeUnion | undefined, extraProps: TCommonExtraProps) => {
  if (!activeType) return null

  switch (activeType.type) {
    case 'labels':
      return <LabelsModal {...activeType.props} {...extraProps} />
    case 'annotations':
      return <AnnotationsModal {...activeType.props} {...extraProps} />
    case 'taints':
      return <TaintsModal {...activeType.props} {...extraProps} />
    case 'tolerations':
      return <TolerationsModal {...activeType.props} {...extraProps} />
    case 'table':
      return <EnrichedTableModal {...activeType.props} {...extraProps} />
    default: {
      const _exhaustive: never = activeType
      return _exhaustive
    }
  }
}
