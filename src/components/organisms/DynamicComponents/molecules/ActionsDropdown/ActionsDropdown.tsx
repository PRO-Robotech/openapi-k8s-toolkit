/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Dropdown, Button } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { TActionUnion } from '../../types/ActionsDropdown'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { buildEditUrl, renderActionModal, getMenuItems } from './utils'

export const ActionsDropdown: FC<{
  data: TDynamicComponentsAppTypeMap['ActionsDropdown']
  children?: any
}> = ({ data, children }) => {
  const { buttonText = 'Actions', containerStyle, actions } = data

  const navigate = useNavigate()
  const location = useLocation()
  const fullPath = location.pathname + location.search

  const [activeAction, setActiveAction] = useState<TActionUnion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

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

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

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

    setActiveAction(action)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setActiveAction(null)
  }

  const menuItems = getMenuItems(actions, handleActionClick)

  return (
    <div style={containerStyle}>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button>
          {buttonText}
          <DownOutlined />
        </Button>
      </Dropdown>

      {activeAction && renderActionModal(activeAction, { open: modalOpen, onClose: handleCloseModal })}

      {children}
    </div>
  )
}
