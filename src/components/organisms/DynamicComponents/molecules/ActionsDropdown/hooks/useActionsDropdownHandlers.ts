import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { notification } from 'antd'
import { AxiosError } from 'axios'
import { createNewEntry, patchEntryWithMergePatch, patchEntryWithReplaceOp } from 'api/forms'
import { parseAll } from '../../utils'
import { buildEditUrl } from '../utils'
import type { TActionUnion, TEvictActionProps } from '../../../types/ActionsDropdown'

type TDeleteModalData = {
  name: string
  endpoint: string
  redirectTo?: string
}

export type TEvictModalData = {
  name: string
  endpoint: string
  namespace?: string
  apiVersion: string
  gracePeriodSeconds?: number
  dryRun?: string[]
}

export type TParseContext = {
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
}

type TUseActionsDropdownHandlersParams = TParseContext

export const parseValueIfString = (value: unknown, ctx: TParseContext) => {
  if (typeof value === 'string') {
    return parseAll({ text: value, ...ctx })
  }
  return value
}

export const buildEvictModalData = (props: TEvictActionProps, ctx: TParseContext): TEvictModalData => {
  const endpointPrepared = parseAll({ text: props.endpoint, ...ctx })
  const namePrepared = parseAll({ text: props.name, ...ctx })
  const namespacePrepared = props.namespace ? parseAll({ text: props.namespace, ...ctx }) : undefined
  const apiVersionPrepared = props.apiVersion ? parseAll({ text: props.apiVersion, ...ctx }) : 'policy/v1'

  return {
    endpoint: endpointPrepared,
    name: namePrepared,
    namespace: namespacePrepared,
    apiVersion: apiVersionPrepared,
    gracePeriodSeconds: props.gracePeriodSeconds,
    dryRun: props.dryRun,
  }
}

export const buildEvictBody = (data: TEvictModalData) => {
  const deleteOptions: Record<string, unknown> = {}
  if (data.gracePeriodSeconds !== undefined) {
    deleteOptions.gracePeriodSeconds = data.gracePeriodSeconds
  }
  if (data.dryRun && data.dryRun.length > 0) {
    deleteOptions.dryRun = data.dryRun
  }

  return {
    apiVersion: data.apiVersion,
    kind: 'Eviction',
    metadata: {
      name: data.name,
      ...(data.namespace ? { namespace: data.namespace } : {}),
    },
    ...(Object.keys(deleteOptions).length > 0 ? { deleteOptions } : {}),
  }
}

const handleEditAction = (
  action: Extract<TActionUnion, { type: 'edit' }>,
  ctx: TParseContext,
  fullPath: string,
  navigate: ReturnType<typeof useNavigate>,
) => {
  const clusterPrepared = parseAll({ text: action.props.cluster, ...ctx })
  const namespacePrepared = action.props.namespace ? parseAll({ text: action.props.namespace, ...ctx }) : undefined
  const syntheticProjectPrepared = action.props.syntheticProject
    ? parseAll({ text: action.props.syntheticProject, ...ctx })
    : undefined
  const apiGroupPrepared = action.props.apiGroup ? parseAll({ text: action.props.apiGroup, ...ctx }) : undefined
  const apiVersionPrepared = parseAll({ text: action.props.apiVersion, ...ctx })
  const pluralPrepared = parseAll({ text: action.props.plural, ...ctx })
  const namePrepared = parseAll({ text: action.props.name, ...ctx })
  const baseprefixPrepared = action.props.baseprefix ? parseAll({ text: action.props.baseprefix, ...ctx }) : undefined

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
}

const handleDeleteAction = (
  action: Extract<TActionUnion, { type: 'delete' }>,
  ctx: TParseContext,
  setDeleteModalData: (data: TDeleteModalData) => void,
) => {
  const endpointPrepared = parseAll({ text: action.props.endpoint, ...ctx })
  const namePrepared = parseAll({ text: action.props.name, ...ctx })
  const redirectToPrepared = action.props.redirectTo ? parseAll({ text: action.props.redirectTo, ...ctx }) : undefined

  setDeleteModalData({
    name: namePrepared,
    endpoint: endpointPrepared,
    redirectTo: redirectToPrepared,
  })
}

const handlePatchActions = (
  action: Extract<TActionUnion, { type: 'cordon' | 'uncordon' | 'suspend' | 'resume' }>,
  ctx: TParseContext,
  onSuccess: (label: string) => void,
  onError: (label: string, error: unknown) => void,
) => {
  const actionLabel = action.props.text || action.type
  const endpointPrepared = parseAll({ text: action.props.endpoint, ...ctx })
  const pathToValuePrepared = parseAll({ text: action.props.pathToValue, ...ctx })
  const valuePrepared = parseValueIfString(action.props.value, ctx)

  patchEntryWithReplaceOp({
    endpoint: endpointPrepared,
    pathToValue: pathToValuePrepared,
    body: valuePrepared,
  })
    .then(() => onSuccess(actionLabel))
    .catch(error => {
      onError(actionLabel, error)
      // eslint-disable-next-line no-console
      console.error(error)
    })
}

const handleRolloutRestartAction = (
  action: Extract<TActionUnion, { type: 'rolloutRestart' }>,
  ctx: TParseContext,
  onSuccess: (label: string) => void,
  onError: (label: string, error: unknown) => void,
) => {
  const actionLabel = action.props.text || 'Rollout restart'
  const endpointPrepared = parseAll({ text: action.props.endpoint, ...ctx })
  const annotationKeyPrepared = action.props.annotationKey
    ? parseAll({ text: action.props.annotationKey, ...ctx })
    : 'kubectl.kubernetes.io/restartedAt'
  const timestampPrepared = action.props.timestamp
    ? parseAll({ text: action.props.timestamp, ...ctx })
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
    .then(() => onSuccess(actionLabel))
    .catch(error => {
      onError(actionLabel, error)
      // eslint-disable-next-line no-console
      console.error(error)
    })
}

const handleOpenKubeletConfigAction = (
  action: Extract<TActionUnion, { type: 'openKubeletConfig' }>,
  ctx: TParseContext,
  setActiveAction: (action: TActionUnion) => void,
  setModalOpen: (open: boolean) => void,
) => {
  const urlPrepared = parseAll({ text: action.props.url, ...ctx })
  const modalTitlePrepared = action.props.modalTitle ? parseAll({ text: action.props.modalTitle, ...ctx }) : undefined
  const modalDescriptionTextPrepared = action.props.modalDescriptionText
    ? parseAll({ text: action.props.modalDescriptionText, ...ctx })
    : undefined

  setActiveAction({
    ...action,
    props: {
      ...action.props,
      url: urlPrepared,
      modalTitle: modalTitlePrepared,
      modalDescriptionText: modalDescriptionTextPrepared,
    },
  })
  setModalOpen(true)
}

export const useActionsDropdownHandlers = ({ replaceValues, multiQueryData }: TUseActionsDropdownHandlersParams) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [notificationApi, notificationContextHolder] = notification.useNotification()

  const fullPath = location.pathname + location.search

  const [activeAction, setActiveAction] = useState<TActionUnion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalData, setDeleteModalData] = useState<TDeleteModalData | null>(null)
  const [evictModalData, setEvictModalData] = useState<TEvictModalData | null>(null)
  const [isEvictLoading, setIsEvictLoading] = useState(false)

  const invalidateMultiQuery = () => {
    queryClient.invalidateQueries({ queryKey: ['multi'] })
  }

  const showSuccess = (actionLabel: string) => {
    invalidateMultiQuery()
    notificationApi.success({
      message: `${actionLabel} successful`,
      placement: 'bottomRight',
    })
  }

  const getErrorDescription = (error: unknown): string => {
    if (error instanceof AxiosError) {
      return error.response?.data?.message || error.message
    }
    if (error instanceof Error) {
      return error.message
    }
    return 'Unknown error'
  }

  const showError = (actionLabel: string, error: unknown) => {
    notificationApi.error({
      message: `${actionLabel} failed`,
      description: getErrorDescription(error),
      placement: 'bottomRight',
    })
  }

  const ctx: TParseContext = { replaceValues, multiQueryData }

  const handleActionClick = (action: TActionUnion) => {
    if (action.type === 'edit') {
      handleEditAction(action, ctx, fullPath, navigate)
      return
    }

    if (action.type === 'delete') {
      handleDeleteAction(action, ctx, setDeleteModalData)
      return
    }

    if (
      action.type === 'cordon' ||
      action.type === 'uncordon' ||
      action.type === 'suspend' ||
      action.type === 'resume'
    ) {
      handlePatchActions(action, ctx, showSuccess, showError)
      return
    }

    if (action.type === 'rolloutRestart') {
      handleRolloutRestartAction(action, ctx, showSuccess, showError)
      return
    }

    if (action.type === 'evict') {
      const evictData = buildEvictModalData(action.props, ctx)
      setEvictModalData(evictData)
      return
    }

    if (action.type === 'openKubeletConfig') {
      handleOpenKubeletConfigAction(action, ctx, setActiveAction, setModalOpen)
      return
    }

    setActiveAction(action)
    setModalOpen(true)
  }

  const handleEvictConfirm = () => {
    if (!evictModalData) return

    setIsEvictLoading(true)
    const body = buildEvictBody(evictModalData)
    const evictLabel = `Evict ${evictModalData.name}`

    createNewEntry({ endpoint: evictModalData.endpoint, body })
      .then(() => showSuccess(evictLabel))
      .catch(error => {
        showError(evictLabel, error)
        // eslint-disable-next-line no-console
        console.error(error)
      })
      .finally(() => {
        setIsEvictLoading(false)
        setEvictModalData(null)
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
    notificationContextHolder,
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
