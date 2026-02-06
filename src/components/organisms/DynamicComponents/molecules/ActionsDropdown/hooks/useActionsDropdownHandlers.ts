import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { createNewEntry, patchEntryWithMergePatch, patchEntryWithReplaceOp } from 'api/forms'
import { parseAll } from '../../utils'
import { buildEditUrl } from '../utils'
import type { TActionUnion } from '../../../types/ActionsDropdown'

type TDeleteModalData = {
  name: string
  endpoint: string
  redirectTo?: string
}

type TUseActionsDropdownHandlersParams = {
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
}

export const useActionsDropdownHandlers = ({ replaceValues, multiQueryData }: TUseActionsDropdownHandlersParams) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const fullPath = location.pathname + location.search

  const [activeAction, setActiveAction] = useState<TActionUnion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalData, setDeleteModalData] = useState<TDeleteModalData | null>(null)

  const invalidateMultiQuery = () => {
    queryClient.invalidateQueries({ queryKey: ['multi'] })
  }

  const parseValueIfString = (value: unknown) => {
    if (typeof value === 'string') {
      return parseAll({ text: value, replaceValues, multiQueryData })
    }
    return value
  }

  const handleActionClick = (action: TActionUnion) => {
    if (action.type === 'edit') {
      const clusterPrepared = parseAll({ text: action.props.cluster, replaceValues, multiQueryData })
      const namespacePrepared = action.props.namespace
        ? parseAll({ text: action.props.namespace, replaceValues, multiQueryData })
        : undefined
      const syntheticProjectPrepared = action.props.syntheticProject
        ? parseAll({ text: action.props.syntheticProject, replaceValues, multiQueryData })
        : undefined
      const apiGroupPrepared = action.props.apiGroup
        ? parseAll({ text: action.props.apiGroup, replaceValues, multiQueryData })
        : undefined
      const apiVersionPrepared = parseAll({ text: action.props.apiVersion, replaceValues, multiQueryData })
      const pluralPrepared = parseAll({ text: action.props.plural, replaceValues, multiQueryData })
      const namePrepared = parseAll({ text: action.props.name, replaceValues, multiQueryData })
      const baseprefixPrepared = action.props.baseprefix
        ? parseAll({ text: action.props.baseprefix, replaceValues, multiQueryData })
        : undefined

      const url = buildEditUrl(
        {
          ...action.props,
          cluster: clusterPrepared,
          namespace: namespacePrepared,
          syntheticProject: syntheticProjectPrepared,
          apiGroup: apiGroupPrepared,
          apiVersion: apiVersionPrepared,
          plural: pluralPrepared,
          name: namePrepared,
          baseprefix: baseprefixPrepared,
        },
        fullPath,
      )
      navigate(url)
      return
    }

    if (action.type === 'delete') {
      const endpointPrepared = parseAll({ text: action.props.endpoint, replaceValues, multiQueryData })
      const namePrepared = parseAll({ text: action.props.name, replaceValues, multiQueryData })
      const redirectToPrepared = action.props.redirectTo
        ? parseAll({ text: action.props.redirectTo, replaceValues, multiQueryData })
        : undefined

      setDeleteModalData({
        name: namePrepared,
        endpoint: endpointPrepared,
        redirectTo: redirectToPrepared,
      })
      return
    }

    if (
      action.type === 'cordon' ||
      action.type === 'uncordon' ||
      action.type === 'suspend' ||
      action.type === 'resume'
    ) {
      const endpointPrepared = parseAll({ text: action.props.endpoint, replaceValues, multiQueryData })
      const pathToValuePrepared = parseAll({ text: action.props.pathToValue, replaceValues, multiQueryData })
      const valuePrepared = parseValueIfString(action.props.value)

      patchEntryWithReplaceOp({
        endpoint: endpointPrepared,
        pathToValue: pathToValuePrepared,
        body: valuePrepared,
      })
        .then(() => invalidateMultiQuery())
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error(error)
        })

      return
    }

    if (action.type === 'rolloutRestart') {
      const endpointPrepared = parseAll({ text: action.props.endpoint, replaceValues, multiQueryData })
      const annotationKeyPrepared = action.props.annotationKey
        ? parseAll({ text: action.props.annotationKey, replaceValues, multiQueryData })
        : 'kubectl.kubernetes.io/restartedAt'
      const timestampPrepared = action.props.timestamp
        ? parseAll({ text: action.props.timestamp, replaceValues, multiQueryData })
        : new Date().toISOString()

      patchEntryWithMergePatch({
        endpoint: endpointPrepared,
        body: {
          spec: {
            template: {
              metadata: {
                annotations: {
                  [annotationKeyPrepared]: timestampPrepared,
                },
              },
            },
          },
        },
      })
        .then(() => invalidateMultiQuery())
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error(error)
        })

      return
    }

    if (action.type === 'evict') {
      const endpointPrepared = parseAll({ text: action.props.endpoint, replaceValues, multiQueryData })
      const namePrepared = parseAll({ text: action.props.name, replaceValues, multiQueryData })
      const namespacePrepared = action.props.namespace
        ? parseAll({ text: action.props.namespace, replaceValues, multiQueryData })
        : undefined
      const apiVersionPrepared = action.props.apiVersion
        ? parseAll({ text: action.props.apiVersion, replaceValues, multiQueryData })
        : 'policy/v1'

      const deleteOptions: Record<string, unknown> = {}
      if (action.props.gracePeriodSeconds !== undefined) {
        deleteOptions.gracePeriodSeconds = action.props.gracePeriodSeconds
      }
      if (action.props.dryRun && action.props.dryRun.length > 0) {
        deleteOptions.dryRun = action.props.dryRun
      }

      const body = {
        apiVersion: apiVersionPrepared,
        kind: 'Eviction',
        metadata: {
          name: namePrepared,
          ...(namespacePrepared ? { namespace: namespacePrepared } : {}),
        },
        ...(Object.keys(deleteOptions).length > 0 ? { deleteOptions } : {}),
      }

      createNewEntry({ endpoint: endpointPrepared, body })
        .then(() => invalidateMultiQuery())
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error(error)
        })

      return
    }

    if (action.type === 'openKubeletConfig') {
      const urlPrepared = parseAll({ text: action.props.url, replaceValues, multiQueryData })
      const target = action.props.target ?? '_blank'
      window.open(urlPrepared, target)
      return
    }

    setActiveAction(action)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setActiveAction(null)
  }

  const handleDeleteModalClose = () => {
    // Smart redirect logic:
    // 1. If redirectTo was provided, use it
    // 2. Else if backlink exists in URL, use it
    // 3. Else just close (table behavior)
    const redirectTo = deleteModalData?.redirectTo
    const backlink = searchParams.get('backlink')

    setDeleteModalData(null)

    if (redirectTo) {
      navigate(redirectTo)
    } else if (backlink) {
      navigate(decodeURIComponent(backlink))
    }
    // else: no navigation, just close modal (table context)
  }

  return {
    activeAction,
    modalOpen,
    deleteModalData,
    handleActionClick,
    handleCloseModal,
    handleDeleteModalClose,
  }
}
