import { FC, ReactElement } from 'react'
import { Dropdown, Button, Spin, Tooltip } from 'antd'
import { DownOutlined, MoreOutlined, WarningOutlined } from '@ant-design/icons'
import { ConfirmModal, DeleteModal, DeleteModalMany } from 'components/atoms'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { getMenuItems, getVisibleActions } from './utils'
import { useActionsDropdownPermissions, useActionsDropdownHandlers } from './hooks'
import { renderActionModal } from './renderActionModal'
import { ScaleModal } from './modals/ScaleModal'
import { CreateFromFilesModal } from './modals/CreateFromFilesModal'
import { Styled } from './styled'

export const ActionsDropdown: FC<{
  data: TDynamicComponentsAppTypeMap['ActionsDropdown']
  children?: ReactElement | ReactElement[]
}> = ({ data, children }) => {
  const { buttonText = 'Actions', buttonVariant = 'default', containerStyle, actions, permissions } = data

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryError, errors } = useMultiQuery()
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

  if (isMultiQueryLoading) {
    return <Spin size="small" />
  }

  if (isMultiQueryError) {
    const errorMessage = errors
      .filter((e): e is Error | string => e !== null)
      .map(e => (typeof e === 'string' ? e : e.message))
      .join('; ')

    return (
      <Tooltip title={errorMessage || 'Failed to load data'}>
        <WarningOutlined style={{ color: 'red' }} />
      </Tooltip>
    )
  }

  const menuItems = getMenuItems(visibleActions, handleActionClick, effectivePermissions)

  const renderButton = () => {
    if (buttonVariant === 'icon') {
      return (
        <Styled.IconButton
          type="text"
          size="small"
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
          }}
          icon={<MoreOutlined />}
        />
      )
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
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        {renderButton()}
      </Dropdown>

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
