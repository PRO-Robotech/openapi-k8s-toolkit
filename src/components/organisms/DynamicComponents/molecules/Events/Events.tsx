/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import jp from 'jsonpath'
import _ from 'lodash'
import { Events as StandaloneEvents } from 'components/molecules'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/themeContext'
import { parseAll } from '../utils'
import { serializeLabelsWithNoEncoding } from './utils'

export const Events: FC<{ data: TDynamicComponentsAppTypeMap['Events']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()

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

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
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
