/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from 'react'
import { Dropdown, Button } from 'antd'
import { DownOutlined, MoreOutlined } from '@ant-design/icons'
import { DeleteModal } from 'components/atoms'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { renderActionModal, getMenuItems } from './utils'
import { useActionsDropdownPermissions, useActionsDropdownHandlers } from './hooks'
import { Styled } from './styled'

export const ActionsDropdown: FC<{
  data: TDynamicComponentsAppTypeMap['ActionsDropdown']
  children?: any
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

  const { activeAction, modalOpen, deleteModalData, handleActionClick, handleCloseModal, handleDeleteModalClose } =
    useActionsDropdownHandlers({
      replaceValues,
      multiQueryData,
    })

  if (isMultiQueryLoading) {
    return <div>Loading...</div>
  }

  if (isMultiQueryErrors) {
    return (
      <div>
        <h4>Errors:</h4>
        {/* eslint-disable-next-line react/no-array-index-key */}
        <ul>{errors.map((e, i) => e && <li key={i}>{typeof e === 'string' ? e : e.message}</li>)}</ul>
      </div>
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
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        {renderButton()}
      </Dropdown>

      {activeAction && renderActionModal(activeAction, { open: modalOpen, onClose: handleCloseModal })}

      {deleteModalData && (
        <DeleteModal name={deleteModalData.name} endpoint={deleteModalData.endpoint} onClose={handleDeleteModalClose} />
      )}

      {children}
    </div>
  )
}
