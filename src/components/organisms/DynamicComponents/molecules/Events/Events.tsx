/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import jp from 'jsonpath'
import _ from 'lodash'
import { Alert, Flex } from 'antd'
import { Events as StandaloneEvents } from 'components/molecules'
import { usePermissions } from 'hooks/usePermissions'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/providers/themeContext'
import { parseAll } from '../utils'
import { useAutoPerRequestError } from '../hooks/useAutoPerRequestError'
import { mergePerRequestErrors } from '../hooks/mergePerRequestErrors'
import { PerRequestError } from '../PerRequestError'
import { serializeLabelsWithNoEncoding } from './utils'

const extractStatusCode = (error: unknown): number | undefined => {
  const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined
  const toCode = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
    return undefined
  }

  const root = asRecord(error) || {}
  const response = asRecord(root.response) || {}
  const body = asRecord(root.body) || {}

  return (
    toCode(response.status) ?? toCode(root.statusCode) ?? toCode(root.status) ?? toCode(root.code) ?? toCode(body.code)
  )
}

export const Events: FC<{ data: TDynamicComponentsAppTypeMap['Events']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading, hasErrorForReq } = useMultiQuery()

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    baseprefix,
    cluster,
    wsUrl,
    pageSize,
    substractHeight,
    limit,
    labelSelector,
    labelSelectorFull,
    fieldSelector,
    baseFactoryNamespacedAPIKey,
    baseFactoryClusterSceopedAPIKey,
    baseFactoryNamespacedBuiltinKey,
    baseFactoryClusterSceopedBuiltinKey,
    baseNamespaceFactoryKey,
    baseNavigationPlural,
    baseNavigationName,
    ...props
  } = data

  const theme = useTheme()
  const partsOfUrl = usePartsOfUrl()
  const autoErrorResult = useAutoPerRequestError(data)
  const { shouldShowError, errorToShow } = mergePerRequestErrors(autoErrorResult, hasErrorForReq, [
    labelSelectorFull?.reqIndex,
  ])

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const clusterPrepared = parseAll({ text: cluster, replaceValues, multiQueryData })

  const wsUrlPrepared = parseAll({ text: wsUrl, replaceValues, multiQueryData })

  const params = new URLSearchParams()

  if (limit) {
    params.set('limit', limit.toString())
  }

  if (labelSelector && Object.keys(labelSelector).length > 0) {
    const parsedObject: Record<string, string> = Object.fromEntries(
      Object.entries(labelSelector).map(
        ([k, v]) => [k, parseAll({ text: v, replaceValues, multiQueryData })] as [string, string],
      ),
    )
    const serializedLabels = serializeLabelsWithNoEncoding(parsedObject)
    if (serializedLabels.length > 0) params.set('labelSelector', serializedLabels)
  }

  if (labelSelectorFull) {
    const root = multiQueryData[`req${labelSelectorFull.reqIndex}`]
    const value = Array.isArray(labelSelectorFull.pathToLabels)
      ? _.get(root || {}, labelSelectorFull.pathToLabels)
      : jp.query(root || {}, `$${labelSelectorFull.pathToLabels}`)[0]

    const serializedLabels = serializeLabelsWithNoEncoding(value)
    if (serializedLabels.length > 0) params.set('labelSelector', serializedLabels)
  }

  if (fieldSelector) {
    const parsedObject: Record<string, string> = Object.fromEntries(
      Object.entries(fieldSelector).map(
        ([k, v]) =>
          [
            parseAll({ text: k, replaceValues, multiQueryData }),
            parseAll({ text: v, replaceValues, multiQueryData }),
          ] as [string, string],
      ),
    )
    const serializedFields = serializeLabelsWithNoEncoding(parsedObject)

    if (serializedFields.length > 0) params.set('fieldSelector', serializedFields)
  }

  const searchParams = params.toString()
  const wsUrlWithParams = `${wsUrlPrepared}${searchParams ? `?${searchParams}` : ''}`
  const namespaceFromWsUrl = (() => {
    try {
      const parsedUrl = new URL(wsUrlWithParams, window.location.origin)
      const namespace = parsedUrl.searchParams.get('namespace')
      return namespace && namespace.length > 0 ? namespace : undefined
    } catch {
      return undefined
    }
  })()

  const isPermissionCheckEnabled = Boolean(!isMultiqueryLoading && clusterPrepared)
  const listPermission = usePermissions({
    cluster: clusterPrepared || '',
    namespace: namespaceFromWsUrl,
    apiGroup: 'events.k8s.io',
    plural: 'events',
    verb: 'list',
    refetchInterval: false,
    enabler: isPermissionCheckEnabled,
  })
  const watchPermission = usePermissions({
    cluster: clusterPrepared || '',
    namespace: namespaceFromWsUrl,
    apiGroup: 'events.k8s.io',
    plural: 'events',
    verb: 'watch',
    refetchInterval: false,
    enabler: isPermissionCheckEnabled,
  })

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  if (shouldShowError) {
    return <PerRequestError error={errorToShow} />
  }

  if (isPermissionCheckEnabled && (listPermission.isPending || watchPermission.isPending)) {
    return (
      <Flex vertical gap={8}>
        <Alert type="info" title="Checking permissions for events stream..." showIcon />
      </Flex>
    )
  }

  if (isPermissionCheckEnabled && (listPermission.isError || watchPermission.isError)) {
    const statusCode = extractStatusCode(listPermission.error) ?? extractStatusCode(watchPermission.error)
    const message = statusCode
      ? `Failed to check permissions for events stream (${statusCode})`
      : 'Failed to check permissions for events stream'
    return (
      <Flex vertical gap={8}>
        <Alert type="error" title={message} showIcon />
      </Flex>
    )
  }

  if (
    isPermissionCheckEnabled &&
    (listPermission.data?.status?.allowed !== true || watchPermission.data?.status?.allowed !== true)
  ) {
    return (
      <Flex vertical gap={8}>
        <Alert type="error" title="Access denied (403)" showIcon />
      </Flex>
    )
  }

  return (
    <>
      <StandaloneEvents
        theme={theme}
        baseprefix={baseprefix}
        cluster={clusterPrepared}
        wsUrl={wsUrlWithParams}
        pageSize={pageSize}
        substractHeight={substractHeight || 340}
        baseFactoryNamespacedAPIKey={baseFactoryNamespacedAPIKey}
        baseFactoryClusterSceopedAPIKey={baseFactoryClusterSceopedAPIKey}
        baseFactoryNamespacedBuiltinKey={baseFactoryNamespacedBuiltinKey}
        baseFactoryClusterSceopedBuiltinKey={baseFactoryClusterSceopedBuiltinKey}
        baseNamespaceFactoryKey={baseNamespaceFactoryKey}
        baseNavigationPlural={baseNavigationPlural}
        baseNavigationName={baseNavigationName}
        {...props}
      />
      {children}
    </>
  )
}
