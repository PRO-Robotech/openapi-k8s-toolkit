/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Dropdown, Button } from 'antd'
import { DownOutlined, MoreOutlined } from '@ant-design/icons'
import { DeleteModal } from 'components/atoms'
import { usePermissions } from 'hooks/usePermissions'
import { createNewEntry, patchEntryWithMergePatch, patchEntryWithReplaceOp } from 'api/forms'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { TActionUnion, TActionsPermissions } from '../../types/ActionsDropdown'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import { buildEditUrl, renderActionModal, getMenuItems, getRequiredPermissions } from './utils'
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
  const queryClient = useQueryClient()
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
        subresource: permissionContext.subresource
          ? parseAll({ text: permissionContext.subresource, replaceValues, multiQueryData })
          : undefined,
      }
    : undefined

  const isPermissionContextValid =
    !!permissionContextPrepared &&
    !isMultiQueryLoading &&
    !!permissionContextPrepared.cluster &&
    permissionContextPrepared.cluster !== '-' &&
    !!permissionContextPrepared.plural &&
    permissionContextPrepared.plural !== '-'

  const shouldCheckPermissions = !permissions
  const requiredPermissions = shouldCheckPermissions ? getRequiredPermissions(actions) : []
  const requiredVerbs = new Set(requiredPermissions.map(permission => permission.verb))

  const permissionBaseParams = {
    cluster: permissionContextPrepared?.cluster || '',
    namespace: permissionContextPrepared?.namespace,
    apiGroup: permissionContextPrepared?.apiGroup,
    plural: permissionContextPrepared?.plural || '',
    subresource: permissionContextPrepared?.subresource,
    refetchInterval: false as const,
  }

  const updatePermission = usePermissions({
    ...permissionBaseParams,
    verb: 'update',
    enabler: shouldCheckPermissions && isPermissionContextValid && requiredVerbs.has('update'),
  })
  const patchPermission = usePermissions({
    ...permissionBaseParams,
    verb: 'patch',
    enabler: shouldCheckPermissions && isPermissionContextValid && requiredVerbs.has('patch'),
  })
  const deletePermission = usePermissions({
    ...permissionBaseParams,
    verb: 'delete',
    enabler: shouldCheckPermissions && isPermissionContextValid && requiredVerbs.has('delete'),
  })
  const createPermission = usePermissions({
    ...permissionBaseParams,
    verb: 'create',
    enabler: shouldCheckPermissions && isPermissionContextValid && requiredVerbs.has('create'),
  })
  const getPermission = usePermissions({
    ...permissionBaseParams,
    verb: 'get',
    enabler: shouldCheckPermissions && isPermissionContextValid && requiredVerbs.has('get'),
  })

  const computedPermissions: TActionsPermissions = {
    canUpdate: requiredVerbs.has('update') ? updatePermission.data?.status.allowed : undefined,
    canPatch: requiredVerbs.has('patch') ? patchPermission.data?.status.allowed : undefined,
    canDelete: requiredVerbs.has('delete') ? deletePermission.data?.status.allowed : undefined,
    canCreate: requiredVerbs.has('create') ? createPermission.data?.status.allowed : undefined,
    canGet: requiredVerbs.has('get') ? getPermission.data?.status.allowed : undefined,
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

  const invalidateMultiQuery = () => {
    queryClient.invalidateQueries({ queryKey: ['multi'] })
  }

  const parseValueIfString = (value: unknown) => {
    if (typeof value === 'string') {
      return parseAll({ text: value, replaceValues, multiQueryData })
    }
    return value
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
      const endpointPrepared = parseAll({ text: action.props.endpoint, replaceValues, multiQueryData })
      const namePrepared = parseAll({ text: action.props.name, replaceValues, multiQueryData })
      const namespacePrepared = action.props.namespace
        ? parseAll({ text: action.props.namespace, replaceValues, multiQueryData })
        : undefined
      const apiVersionPrepared = action.props.apiVersion
        ? parseAll({ text: action.props.apiVersion, replaceValues, multiQueryData })
        : 'policy/v1'

      const deleteOptions: Record<string, unknown> = {}
      if (action.props.gracePeriodSeconds !== undefined) {
        deleteOptions.gracePeriodSeconds = action.props.gracePeriodSeconds
      }
      if (action.props.dryRun && action.props.dryRun.length > 0) {
        deleteOptions.dryRun = action.props.dryRun
      }

      const body = {
        apiVersion: apiVersionPrepared,
        kind: 'Eviction',
        metadata: {
          name: namePrepared,
          ...(namespacePrepared ? { namespace: namespacePrepared } : {}),
        },
        ...(Object.keys(deleteOptions).length > 0 ? { deleteOptions } : {}),
      }

      createNewEntry({ endpoint: endpointPrepared, body })
        .then(() => invalidateMultiQuery())
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error(error)
        })

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
