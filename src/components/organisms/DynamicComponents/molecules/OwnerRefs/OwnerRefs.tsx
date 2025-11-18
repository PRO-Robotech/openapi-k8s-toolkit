/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import jp from 'jsonpath'
import { prepareTemplate } from 'utils/prepareTemplate'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/themeContext'
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
    clusterNamePartOfUrl,
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
    forcedNamespace,
    baseFactoryNamespacedAPIKey,
    baseFactoryClusterSceopedAPIKey,
    baseFactoryNamespacedBuiltinKey,
    baseFactoryClusterSceopedBuiltinKey,
    baseNavigationPluralName,
    baseNavigationSpecificName,
    ...props
  } = data

  const theme = useTheme()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const clusterName = prepareTemplate({
    template: clusterNamePartOfUrl,
    replaceValues,
  })

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

  const refsArr = jp.query(jsonRoot, `$${jsonPathToArrayOfRefs}`)[0]

  if (!Array.isArray(refsArr)) {
    return <div style={containerStyle}>{notArrayErrorText}</div>
  }

  if (refsArr.length === 0) {
    return <div style={containerStyle}>{emptyArrayErrorText}</div>
  }

  if (refsArr.some(el => !isOwnerReference(el))) {
    return <div style={containerStyle}>{isNotRefsArrayErrorText}</div>
  }

  const guardedRefsArr: TOwnerReference[] = refsArr as TOwnerReference[]

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  return (
    <div style={containerStyle}>
      <RefsList
        theme={theme}
        baseprefix={baseprefix}
        cluster={clusterName}
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
        baseNavigationPluralName={baseNavigationPluralName}
        baseNavigationSpecificName={baseNavigationSpecificName}
        listFlexProps={listFlexProps}
        {...props}
      />
      {children}
    </div>
  )
}
