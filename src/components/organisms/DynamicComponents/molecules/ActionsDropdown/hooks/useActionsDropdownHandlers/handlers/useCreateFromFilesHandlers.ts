import { useState } from 'react'
import { createNewEntry } from 'api/forms'
import { parseAll } from '../../../../utils'
import type { TActionUnion } from '../../../../../types/ActionsDropdown'
import type { TCreateFromFilesModalData, TNotificationCallbacks, TParseContext } from '../types'

export const useCreateFromFilesHandlers = (ctx: TParseContext, { showSuccess, showError }: TNotificationCallbacks) => {
  const [createFromFilesModalData, setCreateFromFilesModalData] = useState<TCreateFromFilesModalData | null>(null)
  const [isCreateFromFilesLoading, setIsCreateFromFilesLoading] = useState(false)

  const handleCreateFromFilesAction = (action: Extract<TActionUnion, { type: 'createFromFiles' }>) => {
    const createEndpointPrepared = parseAll({ text: action.props.createEndpoint, ...ctx })
    const namespacePrepared = parseAll({ text: action.props.namespace, ...ctx })
    const apiVersionPrepared = action.props.apiVersion ? parseAll({ text: action.props.apiVersion, ...ctx }) : 'v1'

    setCreateFromFilesModalData({
      createEndpoint: createEndpointPrepared,
      namespace: namespacePrepared,
      resourceKind: action.props.resourceKind,
      apiVersion: apiVersionPrepared,
    })
  }

  const handleCreateFromFilesConfirm = (
    name: string,
    data: Record<string, string>,
    binaryData: Record<string, string>,
  ) => {
    if (!createFromFilesModalData) return

    setIsCreateFromFilesLoading(true)
    const { createEndpoint, namespace, resourceKind, apiVersion } = createFromFilesModalData
    const createLabel = `Create ${resourceKind} ${name}`

    const body: Record<string, unknown> = {
      apiVersion,
      kind: resourceKind,
      metadata: { name, namespace },
    }

    if (Object.keys(data).length > 0) {
      body.data = data
    }
    if (Object.keys(binaryData).length > 0) {
      body.binaryData = binaryData
    }

    createNewEntry({ endpoint: createEndpoint, body })
      .then(() => showSuccess(createLabel))
      .catch(error => {
        showError(createLabel, error)
      })
      .finally(() => {
        setIsCreateFromFilesLoading(false)
        setCreateFromFilesModalData(null)
      })
  }

  const handleCreateFromFilesCancel = () => {
    setCreateFromFilesModalData(null)
    setIsCreateFromFilesLoading(false)
  }

  return {
    createFromFilesModalData,
    isCreateFromFilesLoading,
    handleCreateFromFilesAction,
    handleCreateFromFilesConfirm,
    handleCreateFromFilesCancel,
  }
}
