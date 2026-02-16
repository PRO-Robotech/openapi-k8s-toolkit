/* eslint-disable no-underscore-dangle */
import React, { Suspense, lazy } from 'react'
import { TActiveTypeUnion } from '../../types/AggregatedCounterCard'
import { LabelsModal } from './molecules/LabelsModal'
import { AnnotationsModal } from './molecules/AnnotationsModal'
import { TaintsModal } from './molecules/TaintsModal'
import { TolerationsModal } from './molecules/TolerationsModal'

const LazyEnrichedTableModal = lazy(() =>
  import('./molecules/EnrichedTableModal').then(mod => ({ default: mod.EnrichedTableModal })),
)

type TCommonExtraProps = {
  open: boolean
  onClose: () => void
  disableSubmit?: boolean
}

export const renderActiveType = (activeType: TActiveTypeUnion | undefined, extraProps: TCommonExtraProps) => {
  if (!activeType) return null

  const { open, onClose, disableSubmit } = extraProps

  switch (activeType.type) {
    case 'labels':
      return <LabelsModal {...activeType.props} open={open} onClose={onClose} disableSubmit={disableSubmit} />
    case 'annotations':
      return <AnnotationsModal {...activeType.props} open={open} onClose={onClose} disableSubmit={disableSubmit} />
    case 'taints':
      return <TaintsModal {...activeType.props} open={open} onClose={onClose} disableSubmit={disableSubmit} />
    case 'tolerations':
      return <TolerationsModal {...activeType.props} open={open} onClose={onClose} disableSubmit={disableSubmit} />
    case 'table':
      return (
        <Suspense fallback={null}>
          <LazyEnrichedTableModal {...activeType.props} open={open} onClose={onClose} />
        </Suspense>
      )
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
