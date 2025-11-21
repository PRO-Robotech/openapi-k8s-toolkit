/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import jp from 'jsonpath'
import { prepareTemplate } from 'utils/prepareTemplate'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/themeContext'
import { parseAll } from '../utils'
import { RefsList } from './organsisms/RefsList'
import { isOwnerReference } from './guard'
import { TOwnerReference } from './types'

export const OwnerRefs: FC<{ data: TDynamicComponentsAppTypeMap['OwnerRefs']; children?: any }> = ({
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
    reqIndex,
    errorText,
    notArrayErrorText,
    emptyArrayErrorText,
    isNotRefsArrayErrorText,
    containerStyle,
    listFlexProps,
    keysToForcedLabel,
    forcedRelatedValuePath,
    jsonPathToArrayOfRefs,
    forcedApiVersion,
    forcedNamespace,
    baseFactoryNamespacedAPIKey,
    baseFactoryClusterSceopedAPIKey,
    baseFactoryNamespacedBuiltinKey,
    baseFactoryClusterSceopedBuiltinKey,
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

  const preparedForcedApiVersion = forcedApiVersion
    ? forcedApiVersion.map(({ kind, apiVersion }) => ({
        kind: prepareTemplate({
          template: kind,
          replaceValues,
        }),
        apiVersion: prepareTemplate({
          template: apiVersion,
          replaceValues,
        }),
      }))
    : undefined

  const preparedForcedNamespace = forcedNamespace
    ? prepareTemplate({
        template: forcedNamespace,
        replaceValues,
      })
    : undefined

  const jsonRoot = multiQueryData[`req${reqIndex}`]

  if (jsonRoot === undefined) {
    // eslint-disable-next-line no-console
    return <div style={containerStyle}>{errorText}</div>
  }

  const refsArr = jp.query(jsonRoot, `$${jsonPathToArrayOfRefs}`).flat()

  if (!Array.isArray(refsArr)) {
    return <div style={containerStyle}>{notArrayErrorText}</div>
  }

  if (refsArr.length === 0) {
    return <div style={containerStyle}>{emptyArrayErrorText}</div>
  }

  const refsArrWithForcedApiVersion = refsArr.map(el => {
    const forceFound = preparedForcedApiVersion?.find(force => force.kind === el.kind)
    if (forceFound) {
      return { ...el, apiVersion: forceFound.apiVersion }
    }
    return el
  })

  if (refsArrWithForcedApiVersion.some(el => !isOwnerReference(el))) {
    return <div style={containerStyle}>{isNotRefsArrayErrorText}</div>
  }

  const guardedRefsArr: TOwnerReference[] = refsArrWithForcedApiVersion as TOwnerReference[]

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  return (
    <div style={containerStyle}>
      <RefsList
        theme={theme}
        baseprefix={baseprefix}
        cluster={clusterPrepared}
        refsArr={guardedRefsArr}
        keysToForcedLabel={keysToForcedLabel}
        forcedRelatedValuePath={forcedRelatedValuePath}
        jsonPathToArrayOfRefs={jsonPathToArrayOfRefs}
        forcedNamespace={preparedForcedNamespace}
        rawObjectToFindLabel={jsonRoot as any}
        baseFactoryNamespacedAPIKey={baseFactoryNamespacedAPIKey}
        baseFactoryClusterSceopedAPIKey={baseFactoryClusterSceopedAPIKey}
        baseFactoryNamespacedBuiltinKey={baseFactoryNamespacedBuiltinKey}
        baseFactoryClusterSceopedBuiltinKey={baseFactoryClusterSceopedBuiltinKey}
        baseNavigationPlural={baseNavigationPlural}
        baseNavigationName={baseNavigationName}
        listFlexProps={listFlexProps}
        {...props}
      />
      {children}
    </div>
  )
}
