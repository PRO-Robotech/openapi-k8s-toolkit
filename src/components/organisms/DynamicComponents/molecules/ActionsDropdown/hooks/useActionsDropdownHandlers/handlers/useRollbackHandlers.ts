import { useState } from 'react'
import axios from 'axios'
import { parseAll } from '../../../../utils'
import type { TActionUnion } from '../../../../../types/ActionsDropdown'
import type { TNotificationCallbacks, TParseContext, TRollbackModalData } from '../types'

export const useRollbackHandlers = (ctx: TParseContext, { showSuccess, showError }: TNotificationCallbacks) => {
  const [rollbackModalData, setRollbackModalData] = useState<TRollbackModalData | null>(null)
  const [isRollbackLoading, setIsRollbackLoading] = useState(false)

  const handleRollbackAction = (action: Extract<TActionUnion, { type: 'rollback' }>) => {
    const bffEndpointPrepared = parseAll({ text: action.props.bffEndpoint, ...ctx })
    const resourceNamePrepared = parseAll({ text: action.props.resourceName, ...ctx })
    const resourceEndpointPrepared = parseAll({ text: action.props.resourceEndpoint, ...ctx })
    setRollbackModalData({
      bffEndpoint: bffEndpointPrepared,
      resourceName: resourceNamePrepared,
      resourceEndpoint: resourceEndpointPrepared,
    })
  }

  const handleRollbackConfirm = () => {
    if (!rollbackModalData) return

    setIsRollbackLoading(true)
    const rollbackLabel = `Rollback ${rollbackModalData.resourceName}`

    axios
      .post(rollbackModalData.bffEndpoint, {
        resourceEndpoint: rollbackModalData.resourceEndpoint,
        resourceName: rollbackModalData.resourceName,
      })
      .then(() => showSuccess(rollbackLabel))
      .catch(error => {
        showError(rollbackLabel, error)
      })
      .finally(() => {
        setIsRollbackLoading(false)
        setRollbackModalData(null)
      })
  }

  const handleRollbackCancel = () => {
    setRollbackModalData(null)
    setIsRollbackLoading(false)
  }

  return { rollbackModalData, isRollbackLoading, handleRollbackAction, handleRollbackConfirm, handleRollbackCancel }
}
