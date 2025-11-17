import React, { FC } from 'react'
import jp from 'jsonpath'
import _ from 'lodash'
import { ResourceLink } from 'components/atoms'
import { TOwnerReference } from '../../../../types'

type TRefElementProps = {
  reference: TOwnerReference
  keysToForcedLabel?: string | string[] // jsonpath or keys as string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawObjectToFindLabel?: any
  theme: 'dark' | 'light'
  baseprefix?: string
  cluster: string
  getPlural?: (kind: string, apiVersion?: string) => string | undefined
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
  baseFactoriesMapping?: Record<string, string>
}

export const RefElement: FC<TRefElementProps> = ({
  reference,
  keysToForcedLabel,
  rawObjectToFindLabel,
  theme,
  baseprefix,
  cluster,
  getPlural,
  baseFactoryNamespacedAPIKey,
  baseFactoryClusterSceopedAPIKey,
  baseFactoryNamespacedBuiltinKey,
  baseFactoryClusterSceopedBuiltinKey,
  baseFactoriesMapping,
}) => {
  let forcedName: string | undefined

  if (keysToForcedLabel) {
    forcedName = Array.isArray(keysToForcedLabel)
      ? _.get(rawObjectToFindLabel, keysToForcedLabel)
      : jp.query(rawObjectToFindLabel, `$${keysToForcedLabel}`)[0]
  }

  return (
    <ResourceLink
      kind={reference.kind}
      apiVersion={reference.apiVersion}
      namespace={reference.namespace}
      forcedName={forcedName}
      name={reference.name}
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
  )
}
