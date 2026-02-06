import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { createNewEntry, patchEntryWithMergePatch, patchEntryWithReplaceOp } from 'api/forms'
import { parseAll } from '../../utils'
import { buildEditUrl } from '../utils'
import type { TActionUnion, TEvictActionProps } from '../../../types/ActionsDropdown'

type TDeleteModalData = {
  name: string
  endpoint: string
  redirectTo?: string
}

type TEvictModalData = {
  name: string
  endpoint: string
  namespace?: string
  apiVersion: string
  gracePeriodSeconds?: number
  dryRun?: string[]
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
  const [evictModalData, setEvictModalData] = useState<TEvictModalData | null>(null)
  const [isEvictLoading, setIsEvictLoading] = useState(false)

  const invalidateMultiQuery = () => {
    queryClient.invalidateQueries({ queryKey: ['multi'] })
  }

  const parseValueIfString = (value: unknown) => {
    if (typeof value === 'string') {
      return parseAll({ text: value, replaceValues, multiQueryData })
    }
    return value
  }

  const buildEvictModalData = (props: TEvictActionProps): TEvictModalData => {
    const endpointPrepared = parseAll({ text: props.endpoint, replaceValues, multiQueryData })
    const namePrepared = parseAll({ text: props.name, replaceValues, multiQueryData })
    const namespacePrepared = props.namespace
      ? parseAll({ text: props.namespace, replaceValues, multiQueryData })
      : undefined
    const apiVersionPrepared = props.apiVersion
      ? parseAll({ text: props.apiVersion, replaceValues, multiQueryData })
      : 'policy/v1'

    return {
      endpoint: endpointPrepared,
      name: namePrepared,
      namespace: namespacePrepared,
      apiVersion: apiVersionPrepared,
      gracePeriodSeconds: props.gracePeriodSeconds,
      dryRun: props.dryRun,
    }
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
      const evictData = buildEvictModalData(action.props)
      setEvictModalData(evictData)
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

  const handleEvictConfirm = () => {
    if (!evictModalData) return

    setIsEvictLoading(true)

    const deleteOptions: Record<string, unknown> = {}
    if (evictModalData.gracePeriodSeconds !== undefined) {
      deleteOptions.gracePeriodSeconds = evictModalData.gracePeriodSeconds
    }
    if (evictModalData.dryRun && evictModalData.dryRun.length > 0) {
      deleteOptions.dryRun = evictModalData.dryRun
    }

    const body = {
      apiVersion: evictModalData.apiVersion,
      kind: 'Eviction',
      metadata: {
        name: evictModalData.name,
        ...(evictModalData.namespace ? { namespace: evictModalData.namespace } : {}),
      },
      ...(Object.keys(deleteOptions).length > 0 ? { deleteOptions } : {}),
    }

    createNewEntry({ endpoint: evictModalData.endpoint, body })
      .then(() => invalidateMultiQuery())
      .finally(() => {
        setIsEvictLoading(false)
        setEvictModalData(null)
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error(error)
      })
  }

  const handleEvictCancel = () => {
    setEvictModalData(null)
    setIsEvictLoading(false)
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
    evictModalData,
    isEvictLoading,
    handleActionClick,
    handleCloseModal,
    handleDeleteModalClose,
    handleEvictConfirm,
    handleEvictCancel,
  }
}
