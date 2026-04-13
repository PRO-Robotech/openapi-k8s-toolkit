import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { notification } from 'antd'
import { AxiosError } from 'axios'
import { parseAll } from '../../../utils'
import type { TActionUnion } from '../../../../types/ActionsDropdown'
import { buildDeleteChildrenData, buildEvictModalData } from './helpers'
import {
  fireTriggerRunAction,
  handleDeleteAction,
  handleDownloadAsFilesAction,
  handleEditAction,
  handleOpenKubeletConfigAction,
  handlePatchActions,
  handleRolloutRestartAction,
} from './actionHandlers'
import {
  useScaleHandlers,
  useEvictHandlers,
  useRerunHandlers,
  useDrainHandlers,
  useRollbackHandlers,
  useCreateFromFilesHandlers,
} from './handlers'
import type { TDeleteChildrenModalData, TDeleteModalData, TNotificationCallbacks, TParseContext } from './types'

export const useActionsDropdownHandlers = ({ replaceValues, multiQueryData }: TParseContext) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [notificationApi, notificationContextHolder] = notification.useNotification()

  const fullPath = location.pathname + location.search

  const [activeAction, setActiveAction] = useState<TActionUnion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalData, setDeleteModalData] = useState<TDeleteModalData | null>(null)
  const [deleteChildrenModalData, setDeleteChildrenModalData] = useState<TDeleteChildrenModalData | null>(null)

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
  const notificationCallbacks: TNotificationCallbacks = { showSuccess, showError }

  const { scaleModalData, isScaleLoading, handleScaleAction, handleScaleConfirm, handleScaleCancel } = useScaleHandlers(
    ctx,
    notificationCallbacks,
  )
  const { evictModalData, isEvictLoading, setEvictModalData, handleEvictConfirm, handleEvictCancel } =
    useEvictHandlers(notificationCallbacks)
  const { rerunModalData, isRerunLoading, handleRerunLastAction, handleRerunConfirm, handleRerunCancel } =
    useRerunHandlers(ctx, multiQueryData, notificationCallbacks)
  const { drainModalData, isDrainLoading, handleDrainAction, handleDrainConfirm, handleDrainCancel } = useDrainHandlers(
    ctx,
    notificationCallbacks,
    notificationApi,
    invalidateMultiQuery,
  )
  const { rollbackModalData, isRollbackLoading, handleRollbackAction, handleRollbackConfirm, handleRollbackCancel } =
    useRollbackHandlers(ctx, notificationCallbacks)
  const {
    createFromFilesModalData,
    isCreateFromFilesLoading,
    handleCreateFromFilesAction,
    handleCreateFromFilesConfirm,
    handleCreateFromFilesCancel,
  } = useCreateFromFilesHandlers(ctx, notificationCallbacks)

  const handleDeleteChildrenAction = (action: Extract<TActionUnion, { type: 'deleteChildren' }>) => {
    try {
      const data = buildDeleteChildrenData(action, ctx)
      setDeleteChildrenModalData(data)
    } catch (error) {
      const childResourceNamePrepared = parseAll({ text: action.props.childResourceName, ...ctx })
      showError(`Delete ${childResourceNamePrepared}`, error)
    }
  }

  const handleDeleteChildrenClose = () => {
    setDeleteChildrenModalData(null)
    invalidateMultiQuery()
  }

  const handleActionClick = (action: TActionUnion) => {
    switch (action.type) {
      case 'edit':
        handleEditAction(action, ctx, fullPath, navigate)
        return

      case 'delete':
        handleDeleteAction(action, ctx, setDeleteModalData)
        return

      case 'cordon':
      case 'uncordon':
      case 'suspend':
      case 'resume':
        handlePatchActions(action, ctx, showSuccess, showError)
        return

      case 'rolloutRestart':
        handleRolloutRestartAction(action, ctx, showSuccess, showError)
        return

      case 'evict': {
        const evictData = buildEvictModalData(action.props, ctx)
        setEvictModalData(evictData)
        return
      }

      case 'openKubeletConfig':
        handleOpenKubeletConfigAction(action, ctx, setActiveAction, setModalOpen)
        return

      case 'scale':
        handleScaleAction(action)
        return

      case 'triggerRun':
        fireTriggerRunAction(action, ctx, multiQueryData, notificationCallbacks)
        return

      case 'deleteChildren':
        handleDeleteChildrenAction(action)
        return

      case 'rerunLast':
        handleRerunLastAction(action)
        return

      case 'drain':
        handleDrainAction(action)
        return

      case 'rollback':
        handleRollbackAction(action)
        return

      case 'downloadAsFiles':
        handleDownloadAsFilesAction(action, ctx, setActiveAction, setModalOpen)
        return

      case 'createFromFiles':
        handleCreateFromFilesAction(action)
        return

      default: {
        setActiveAction(action)
        setModalOpen(true)
      }
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setActiveAction(null)
  }

  const handleDeleteModalClose = () => {
    const redirectTo = deleteModalData?.redirectTo
    const backlink = searchParams.get('backlink')

    setDeleteModalData(null)

    if (redirectTo) {
      navigate(redirectTo)
    } else if (backlink) {
      navigate(decodeURIComponent(backlink))
    }
  }

  return {
    notificationContextHolder,
    activeAction,
    modalOpen,
    deleteModalData,
    evictModalData,
    isEvictLoading,
    scaleModalData,
    isScaleLoading,
    deleteChildrenModalData,
    rerunModalData,
    isRerunLoading,
    drainModalData,
    isDrainLoading,
    rollbackModalData,
    isRollbackLoading,
    handleActionClick,
    handleCloseModal,
    handleDeleteModalClose,
    handleEvictConfirm,
    handleEvictCancel,
    handleScaleConfirm,
    handleScaleCancel,
    handleDeleteChildrenClose,
    handleRerunConfirm,
    handleRerunCancel,
    handleDrainConfirm,
    handleDrainCancel,
    handleRollbackConfirm,
    handleRollbackCancel,
    createFromFilesModalData,
    isCreateFromFilesLoading,
    handleCreateFromFilesConfirm,
    handleCreateFromFilesCancel,
  }
}
