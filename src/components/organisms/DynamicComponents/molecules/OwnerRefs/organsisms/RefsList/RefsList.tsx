import React, { FC, useEffect, useState } from 'react'
import { Flex, FlexProps } from 'antd'
import { getKinds } from 'api/bff/search/getKinds'
import { getSortedKindsAll } from 'utils/getSortedKindsAll'
import { pluralByKind } from 'utils/pluralByKind'
import { TKindIndex } from 'localTypes/bff/search'
import { TKindWithVersion } from 'localTypes/search'
import { TNavigationResource } from 'localTypes/navigations'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { TOwnerReference } from '../../types'
import { RefElement } from './molecules'

export type TRefsListProps = {
  theme: 'dark' | 'light'
  baseprefix?: string
  cluster: string
  refsArr: TOwnerReference[]
  keysToForcedLabel?: string | string[] // jsonpath or keys as string[]
  forcedRelatedValuePath?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawObjectToFindLabel?: any
  jsonPathToArrayOfRefs: string
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
  baseNavigationPluralName: string
  baseNavigationSpecificName: string
  listFlexProps?: FlexProps
}

export const RefsList: FC<TRefsListProps> = ({
  theme,
  baseprefix,
  cluster,
  refsArr,
  keysToForcedLabel,
  forcedRelatedValuePath,
  rawObjectToFindLabel,
  jsonPathToArrayOfRefs,
  baseFactoryNamespacedAPIKey,
  baseFactoryClusterSceopedAPIKey,
  baseFactoryNamespacedBuiltinKey,
  baseFactoryClusterSceopedBuiltinKey,
  baseNavigationPluralName,
  baseNavigationSpecificName,
  listFlexProps,
}) => {
  // const [error, setError] = useState<TRequestError | undefined>()
  // const [isLoading, setIsLoading] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [kindIndex, setKindIndex] = useState<TKindIndex>()
  const [kindsWithVersion, setKindWithVersion] = useState<TKindWithVersion[]>()

  useEffect(() => {
    // setIsLoading(true)
    // setError(undefined)
    getKinds({ clusterName: cluster })
      .then(data => {
        setKindIndex(data)
        setKindWithVersion(getSortedKindsAll(data))
        // setIsLoading(false)
        // setError(undefined)
      })
      .catch(error => {
        // setIsLoading(false)
        // setError(error)
        // eslint-disable-next-line no-console
        console.error(error)
      })
  }, [cluster])

  const { data: navigationDataArr } = useK8sSmartResource<{
    items: TNavigationResource[]
  }>({
    cluster,
    group: 'front.in-cloud.io',
    version: 'v1alpha1',
    plural: baseNavigationPluralName,
    fieldSelector: `metadata.name=${baseNavigationSpecificName}`,
  })

  const getPlural = kindsWithVersion ? pluralByKind(kindsWithVersion) : undefined

  const baseFactoriesMapping =
    navigationDataArr && navigationDataArr.items && navigationDataArr.items.length > 0
      ? navigationDataArr.items[0].spec?.baseFactoriesMapping
      : undefined

  return (
    <Flex vertical gap={8} {...listFlexProps}>
      {refsArr.map(ref => (
        <RefElement
          key={JSON.stringify(ref)}
          reference={ref}
          keysToForcedLabel={keysToForcedLabel}
          forcedRelatedValuePath={forcedRelatedValuePath}
          rawObjectToFindLabel={rawObjectToFindLabel}
          jsonPathToArrayOfRefs={jsonPathToArrayOfRefs}
          theme={theme}
          baseprefix={baseprefix}
          cluster={cluster}
          getPlural={getPlural}
          baseFactoryNamespacedAPIKey={baseFactoryNamespacedAPIKey}
          baseFactoryClusterSceopedAPIKey={baseFactoryClusterSceopedAPIKey}
          baseFactoryNamespacedBuiltinKey={baseFactoryNamespacedBuiltinKey}
          baseFactoryClusterSceopedBuiltinKey={baseFactoryClusterSceopedBuiltinKey}
          baseFactoriesMapping={baseFactoriesMapping}
        />
      ))}
    </Flex>
  )
}
