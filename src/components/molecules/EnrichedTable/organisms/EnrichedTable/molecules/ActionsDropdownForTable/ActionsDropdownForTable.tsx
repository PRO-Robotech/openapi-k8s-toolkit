import React, { FC, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Dropdown } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import { TJSON } from 'localTypes/JSON'
import { parseApiVersion } from 'utils/getResourceLink/getResourceLink'
import { MultiQueryProvider } from '../../../../../../organisms/DynamicRendererWithProviders/providers/multiQueryProvider'
import {
  TActionUnion,
  TEditActionProps,
} from '../../../../../../organisms/DynamicComponents/types/ActionsDropdown'
import {
  buildEditUrl,
  renderActionModal,
  getMenuItems,
} from '../../../../../../organisms/DynamicComponents/molecules/ActionsDropdown/utils'
import { TinyButton } from '../../atoms'
import { TInternalDataForControls } from '../../types'

interface ActionsDropdownForTableProps {
  actions: TActionUnion[]
  rowData: TJSON
  controlsData: TInternalDataForControls
}

export const ActionsDropdownForTable: FC<ActionsDropdownForTableProps> = ({
  actions,
  rowData,
  controlsData,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const fullPath = location.pathname + location.search

  const [activeAction, setActiveAction] = useState<TActionUnion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleActionClick = (action: TActionUnion) => {
    if (action.type === 'edit') {
      const { apiGroup, apiVersion } = parseApiVersion(controlsData.apiGroupAndVersion)
      const editProps: TEditActionProps = {
        ...action.props,
        cluster: controlsData.cluster,
        namespace: controlsData.namespace,
        syntheticProject: controlsData.syntheticProject,
        apiGroup,
        apiVersion,
        plural: controlsData.plural,
        name: controlsData.name,
        baseprefix: controlsData.pathPrefix.includes('builtin') ? '/forms/builtin' : '/forms/apis',
      }

      const url = buildEditUrl(editProps, fullPath)
      navigate(url)
      return
    }

    setActiveAction(action)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setActiveAction(null)
  }

  const menuItems = getMenuItems(actions, handleActionClick)

  return (
    <>
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <TinyButton
          type="text"
          size="large"
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
          }}
          icon={<MoreOutlined size={16} />}
        />
      </Dropdown>

      {activeAction && modalOpen && (
        <MultiQueryProvider urls={[]} dataToApplyToContext={rowData}>
          {renderActionModal(activeAction, { open: modalOpen, onClose: handleCloseModal })}
        </MultiQueryProvider>
      )}
    </>
  )
}
