import React, { FC } from 'react'
import { Flex, FlexProps } from 'antd'
import { pluralByKind } from 'utils/pluralByKind'
import { useKinds } from 'hooks/useKinds'
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
  forcedNamespace?: string
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
  baseNavigationPlural: string
  baseNavigationName: string
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
  forcedNamespace,
  baseFactoryNamespacedAPIKey,
  baseFactoryClusterSceopedAPIKey,
  baseFactoryNamespacedBuiltinKey,
  baseFactoryClusterSceopedBuiltinKey,
  baseNavigationPlural,
  baseNavigationName,
  listFlexProps,
}) => {
  // const [error, setError] = useState<TRequestError | undefined>()
  // const [isLoading, setIsLoading] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const { data: kindsData } = useKinds({ cluster })

  const { data: navigationDataArr } = useK8sSmartResource<{
    items: TNavigationResource[]
  }>({
    cluster,
    apiGroup: 'front.in-cloud.io',
    apiVersion: 'v1alpha1',
    plural: baseNavigationPlural,
    fieldSelector: `metadata.name=${baseNavigationName}`,
  })

  const getPlural = kindsData?.kindsWithVersion ? pluralByKind(kindsData?.kindsWithVersion) : undefined

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
          forcedNamespace={forcedNamespace}
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
