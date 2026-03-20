import { FC, ReactElement, useRef, useState } from 'react'
import { ConfigProvider, Dropdown, Button, Spin, Tooltip } from 'antd'
import { DownOutlined, MoreOutlined, WarningOutlined } from '@ant-design/icons'
import { ConfirmModal, DeleteModal, DeleteModalMany } from 'components/atoms'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { usePerRequestError } from '../hooks/usePerRequestError'
import { getMenuItems, getVisibleActions } from './utils'
import { useActionsDropdownPermissions, useActionsDropdownHandlers } from './hooks'
import { renderActionModal } from './renderActionModal'
import { ScaleModal } from './modals/ScaleModal'
import { CreateFromFilesModal } from './modals/CreateFromFilesModal'
import { DEFAULT_MENU_MAX_HEIGHT_PX, getDropdownPlacement, TActionsDropdownPlacement } from './dropdownPlacement'
import { Styled } from './styled'

export const ActionsDropdown: FC<{
  data: TDynamicComponentsAppTypeMap['ActionsDropdown']
  children?: ReactElement | ReactElement[]
}> = ({ data, children }) => {
  const { buttonText = 'Actions', buttonVariant = 'default', containerStyle, actions, permissions } = data

  const { data: multiQueryData, isLoading: isMultiQueryLoading } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})
  const safeMultiQueryData = multiQueryData ?? {}

  const effectivePermissions = useActionsDropdownPermissions({
    actions,
    permissions,
    replaceValues,
    multiQueryData: safeMultiQueryData,
    isMultiQueryLoading,
  })

  const visibleActions = getVisibleActions(actions, {
    replaceValues,
    multiQueryData: safeMultiQueryData,
  })

  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const [dropdownPlacement, setDropdownPlacement] = useState<TActionsDropdownPlacement>('bottomLeft')
  const [menuMaxHeightPx, setMenuMaxHeightPx] = useState(DEFAULT_MENU_MAX_HEIGHT_PX)

  const {
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
  } = useActionsDropdownHandlers({
    replaceValues,
    multiQueryData: safeMultiQueryData,
  })

  const { shouldShowError, errorToShow } = usePerRequestError(data.reqIndex)

  if (isMultiQueryLoading) {
    return <Spin size="small" />
  }

  if (shouldShowError) {
    const resolveMessage = () => {
      if (!errorToShow) return 'Failed to load data'
      return typeof errorToShow === 'string' ? errorToShow : errorToShow.message
    }
    const errorMessage = resolveMessage()

    return (
      <Tooltip title={errorMessage}>
        <WarningOutlined style={{ color: 'red' }} />
      </Tooltip>
    )
  }

  const menuItems = getMenuItems(visibleActions, handleActionClick, effectivePermissions)

  const handleDropdownOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      return
    }

    const triggerRect = triggerRef.current?.getBoundingClientRect()
    if (!triggerRect) {
      return
    }

    const { placement, maxMenuHeightPx } = getDropdownPlacement({
      triggerTop: triggerRect.top,
      triggerBottom: triggerRect.bottom,
      viewportHeight: window.innerHeight,
      actionsCount: menuItems.length,
    })

    setDropdownPlacement(placement)
    setMenuMaxHeightPx(maxMenuHeightPx)
  }

  const renderButton = () => {
    if (buttonVariant === 'icon') {
      return <Styled.IconButton type="text" size="small" icon={<MoreOutlined />} />
    }
    return (
      <Button>
        {buttonText}
        <DownOutlined />
      </Button>
    )
  }

  return (
    <div style={containerStyle}>
      {notificationContextHolder}
      <ConfigProvider
        theme={{ components: { Dropdown: { zIndexPopup: 2000 } } }}
        getPopupContainer={trigger => trigger?.ownerDocument?.body ?? document.body}
      >
        <Dropdown
          menu={{
            items: menuItems,
            style: { maxHeight: menuMaxHeightPx, overflowY: 'auto' },
          }}
          trigger={['click']}
          placement={dropdownPlacement}
          autoAdjustOverflow
          onOpenChange={handleDropdownOpenChange}
        >
          <span
            ref={triggerRef}
            onClick={e => {
              e.stopPropagation()
            }}
          >
            {renderButton()}
          </span>
        </Dropdown>
      </ConfigProvider>

      {activeAction && renderActionModal(activeAction, { open: modalOpen, onClose: handleCloseModal })}

      {deleteModalData && (
        <DeleteModal name={deleteModalData.name} endpoint={deleteModalData.endpoint} onClose={handleDeleteModalClose} />
      )}

      {evictModalData && (
        <ConfirmModal
          title={`Evict \u00AB${evictModalData.name}?\u00BB`}
          onConfirm={handleEvictConfirm}
          onClose={handleEvictCancel}
          confirmText="Evict"
          confirmLoading={isEvictLoading}
          danger
        >
          This will evict the pod. It may be blocked by PodDisruptionBudget.
        </ConfirmModal>
      )}

      {scaleModalData && (
        <ScaleModal
          open
          currentReplicas={scaleModalData.currentReplicas}
          name={scaleModalData.name}
          onConfirm={handleScaleConfirm}
          onClose={handleScaleCancel}
          isLoading={isScaleLoading}
        />
      )}

      {deleteChildrenModalData && (
        <DeleteModalMany data={deleteChildrenModalData.children} onClose={handleDeleteChildrenClose} />
      )}

      {rerunModalData && (
        <ConfirmModal
          title={`Rerun job "${rerunModalData.sourceName}"?`}
          onConfirm={handleRerunConfirm}
          onClose={handleRerunCancel}
          confirmText="Rerun"
          confirmLoading={isRerunLoading}
        >
          This will create a new Job with the same spec.
        </ConfirmModal>
      )}

      {drainModalData && (
        <ConfirmModal
          title={`Drain node \u00AB${drainModalData.nodeName}\u00BB?`}
          onConfirm={handleDrainConfirm}
          onClose={handleDrainCancel}
          confirmText="Drain"
          confirmLoading={isDrainLoading}
          danger
        >
          This will cordon the node and evict all eligible pods. DaemonSet pods will be skipped.
        </ConfirmModal>
      )}

      {rollbackModalData && (
        <ConfirmModal
          title={`Rollback \u00AB${rollbackModalData.resourceName}\u00BB?`}
          onConfirm={handleRollbackConfirm}
          onClose={handleRollbackCancel}
          confirmText="Rollback"
          confirmLoading={isRollbackLoading}
          danger
        >
          This will revert the resource to its previous revision.
        </ConfirmModal>
      )}

      {createFromFilesModalData && (
        <CreateFromFilesModal
          open
          onClose={handleCreateFromFilesCancel}
          onConfirm={handleCreateFromFilesConfirm}
          resourceKind={createFromFilesModalData.resourceKind}
          namespace={createFromFilesModalData.namespace}
          isLoading={isCreateFromFilesLoading}
        />
      )}

      {children}
    </div>
  )
}
