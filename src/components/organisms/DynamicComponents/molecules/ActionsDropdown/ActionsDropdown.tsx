/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Dropdown, Button } from 'antd'
import { DownOutlined, MoreOutlined } from '@ant-design/icons'
import { DeleteModal } from 'components/atoms'
import { usePermissions } from 'hooks/usePermissions'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { TActionUnion, TActionsPermissions } from '../../types/ActionsDropdown'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { buildEditUrl, renderActionModal, getMenuItems } from './utils'
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

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const fullPath = location.pathname + location.search

  const [activeAction, setActiveAction] = useState<TActionUnion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalData, setDeleteModalData] = useState<{
    name: string
    endpoint: string
    redirectTo?: string
  } | null>(null)

  const { data: multiQueryData, isLoading: isMultiQueryLoading, isError: isMultiQueryErrors, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const permissionContextPrepared = permissionContext
    ? {
        cluster: parseAll({ text: permissionContext.cluster, replaceValues, multiQueryData }),
        namespace: permissionContext.namespace
          ? parseAll({ text: permissionContext.namespace, replaceValues, multiQueryData })
          : undefined,
        apiGroup: permissionContext.apiGroup
          ? parseAll({ text: permissionContext.apiGroup, replaceValues, multiQueryData })
          : undefined,
        plural: parseAll({ text: permissionContext.plural, replaceValues, multiQueryData }),
      }
    : undefined

  const isPermissionContextValid =
    !!permissionContextPrepared &&
    !isMultiQueryLoading &&
    !!permissionContextPrepared.cluster &&
    permissionContextPrepared.cluster !== '-' &&
    !!permissionContextPrepared.plural &&
    permissionContextPrepared.plural !== '-'

  const permissionBaseParams = {
    cluster: permissionContextPrepared?.cluster || '',
    namespace: permissionContextPrepared?.namespace,
    apiGroup: permissionContextPrepared?.apiGroup,
    plural: permissionContextPrepared?.plural || '',
    refetchInterval: false as const,
    enabler: isPermissionContextValid,
  }

  const updatePermission = usePermissions({ ...permissionBaseParams, verb: 'update' })
  const patchPermission = usePermissions({ ...permissionBaseParams, verb: 'patch' })
  const deletePermission = usePermissions({ ...permissionBaseParams, verb: 'delete' })

  const computedPermissions: TActionsPermissions = {
    canUpdate: updatePermission.data?.status.allowed,
    canPatch: patchPermission.data?.status.allowed,
    canDelete: deletePermission.data?.status.allowed,
  }

  const effectivePermissions = permissions ?? computedPermissions

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
