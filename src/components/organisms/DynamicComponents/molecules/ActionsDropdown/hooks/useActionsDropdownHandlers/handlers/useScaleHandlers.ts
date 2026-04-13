import { useState } from 'react'
import { updateEntry } from 'api/forms'
import { parseAll } from '../../../../utils'
import type { TActionUnion } from '../../../../../types/ActionsDropdown'
import type { TNotificationCallbacks, TParseContext, TScaleModalData } from '../types'

export const useScaleHandlers = (ctx: TParseContext, { showSuccess, showError }: TNotificationCallbacks) => {
  const [scaleModalData, setScaleModalData] = useState<TScaleModalData | null>(null)
  const [isScaleLoading, setIsScaleLoading] = useState(false)

  const handleScaleAction = (action: Extract<TActionUnion, { type: 'scale' }>) => {
    const endpointPrepared = parseAll({ text: action.props.endpoint, ...ctx })
    const namePrepared = parseAll({ text: action.props.name, ...ctx })
    const namespacePrepared = action.props.namespace ? parseAll({ text: action.props.namespace, ...ctx }) : undefined
    const apiVersionPrepared = action.props.apiVersion
      ? parseAll({ text: action.props.apiVersion, ...ctx })
      : 'autoscaling/v1'
    const currentReplicasStr = parseAll({ text: action.props.currentReplicas, ...ctx })
    const currentReplicas = parseInt(currentReplicasStr, 10) || 0

    setScaleModalData({
      endpoint: endpointPrepared,
      currentReplicas,
      name: namePrepared,
      namespace: namespacePrepared,
      apiVersion: apiVersionPrepared,
    })
  }

  const handleScaleConfirm = (newReplicas: number) => {
    if (!scaleModalData) return

    setIsScaleLoading(true)
    const body = {
      apiVersion: scaleModalData.apiVersion,
      kind: 'Scale',
      metadata: {
        name: scaleModalData.name,
        ...(scaleModalData.namespace ? { namespace: scaleModalData.namespace } : {}),
      },
      spec: { replicas: newReplicas },
    }

    const scaleLabel = `Scale ${scaleModalData.name}`

    updateEntry({ endpoint: scaleModalData.endpoint, body })
      .then(() => showSuccess(scaleLabel))
      .catch(error => {
        showError(scaleLabel, error)
      })
      .finally(() => {
        setIsScaleLoading(false)
        setScaleModalData(null)
      })
  }

  const handleScaleCancel = () => {
    setScaleModalData(null)
    setIsScaleLoading(false)
  }

  return { scaleModalData, isScaleLoading, handleScaleAction, handleScaleConfirm, handleScaleCancel }
}
