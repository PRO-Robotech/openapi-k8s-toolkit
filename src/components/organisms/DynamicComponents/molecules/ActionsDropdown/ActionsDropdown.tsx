import { FC, ReactNode } from 'react'
import { Dropdown, Button, Spin, Tooltip } from 'antd'
import { DownOutlined, MoreOutlined, WarningOutlined } from '@ant-design/icons'
import { ConfirmModal, DeleteModal } from 'components/atoms'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { renderActionModal, getMenuItems } from './utils'
import { useActionsDropdownPermissions, useActionsDropdownHandlers } from './hooks'
import { Styled } from './styled'

export const ActionsDropdown: FC<{
  data: TDynamicComponentsAppTypeMap['ActionsDropdown']
  children?: ReactNode
}> = ({ data, children }) => {
  const {
    buttonText = 'Actions',
    buttonVariant = 'default',
    containerStyle,
    actions,
    permissions,
    permissionContext,
  } = data

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const effectivePermissions = useActionsDropdownPermissions({
    actions,
    permissions,
    permissionContext,
    replaceValues,
    multiQueryData,
    isMultiQueryLoading,
  })

  const {
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
  } = useActionsDropdownHandlers({
    replaceValues,
    multiQueryData,
  })

  if (isMultiQueryLoading) {
    return <Spin size="small" />
  }

  if (isMultiQueryErrors) {
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

  const menuItems = getMenuItems(actions, handleActionClick, effectivePermissions)

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
          title={`Evict «${evictModalData.name}?»`}
          onConfirm={handleEvictConfirm}
          onClose={handleEvictCancel}
          confirmText="Evict"
          confirmLoading={isEvictLoading}
          danger
        >
          This will evict the pod. It may be blocked by PodDisruptionBudget.
        </ConfirmModal>
      )}

      {children}
    </div>
  )
}
