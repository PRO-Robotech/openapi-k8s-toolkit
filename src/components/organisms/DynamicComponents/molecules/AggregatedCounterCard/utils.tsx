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

export const renderIcon = (customLogo: string, colorText: string): JSX.Element | null => {
  if (customLogo) {
    // Decode base64 SVG and replace all fill placeholders
    try {
      const decodedSvg = atob(customLogo)
      // Replace all instances of {token.colorText} with actual color
      const svgWithFill = decodedSvg.replace(/\{token\.colorText\}/g, `"${colorText}"`)
      // eslint-disable-next-line react/no-danger
      return <div dangerouslySetInnerHTML={{ __html: svgWithFill }} />
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error decoding custom logo:', error)
      return null
    }
  }
  return null
}
