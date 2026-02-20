import { useState } from 'react'
import { createNewEntry } from 'api/forms'
import { parseAll } from '../../../../utils'
import type { TActionUnion } from '../../../../../types/ActionsDropdown'
import { resolveObjectFromTemplate, stripMetadataForRerun } from '../helpers'
import type { TNotificationCallbacks, TParseContext, TRerunModalData } from '../types'

export const useRerunHandlers = (
  ctx: TParseContext,
  multiQueryData: Record<string, unknown>,
  { showSuccess, showError }: TNotificationCallbacks,
) => {
  const [rerunModalData, setRerunModalData] = useState<TRerunModalData | null>(null)
  const [isRerunLoading, setIsRerunLoading] = useState(false)

  const handleRerunLastAction = (action: Extract<TActionUnion, { type: 'rerunLast' }>) => {
    const createEndpointPrepared = parseAll({ text: action.props.createEndpoint, ...ctx })
    const sourceJobNamePrepared = parseAll({ text: action.props.sourceJobName, ...ctx })

    const sourceJobObj = resolveObjectFromTemplate(action.props.sourceJobSpec, multiQueryData) as
      | Record<string, unknown>
      | undefined

    if (!sourceJobObj) {
      showError('Rerun job', new Error('Could not resolve source job spec from resource data'))
      return
    }

    setRerunModalData({
      createEndpoint: createEndpointPrepared,
      sourceName: sourceJobNamePrepared,
      sourceSpec: sourceJobObj,
    })
  }

  const handleRerunConfirm = () => {
    if (!rerunModalData) return

    setIsRerunLoading(true)
    const body = stripMetadataForRerun(rerunModalData.sourceSpec, rerunModalData.sourceName)
    const rerunLabel = `Rerun ${rerunModalData.sourceName}`

    createNewEntry({ endpoint: rerunModalData.createEndpoint, body })
      .then(() => showSuccess(rerunLabel))
      .catch(error => {
        showError(rerunLabel, error)
      })
      .finally(() => {
        setIsRerunLoading(false)
        setRerunModalData(null)
      })
  }

  const handleRerunCancel = () => {
    setRerunModalData(null)
    setIsRerunLoading(false)
  }

  return { rerunModalData, isRerunLoading, handleRerunLastAction, handleRerunConfirm, handleRerunCancel }
}
