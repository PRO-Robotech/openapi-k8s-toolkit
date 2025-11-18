/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import jp from 'jsonpath'
import _ from 'lodash'
import { ResourceLink } from 'components/atoms'
import { TOwnerReference } from '../../../../types'
import { findOwnerReferencePath, resolveFormPath } from './utils'

type TRefElementProps = {
  reference: TOwnerReference
  keysToForcedLabel?: string | string[] // jsonpath or keys as string[]
  forcedRelatedValuePath?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawObjectToFindLabel?: any
  jsonPathToArrayOfRefs: string
  forcedNamespace?: string
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
  forcedRelatedValuePath,
  rawObjectToFindLabel,
  jsonPathToArrayOfRefs,
  forcedNamespace,
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
  let objectNamespace: string | undefined

  if (keysToForcedLabel && rawObjectToFindLabel) {
    forcedName = Array.isArray(keysToForcedLabel)
      ? _.get(rawObjectToFindLabel, keysToForcedLabel)
      : jp.query(rawObjectToFindLabel, `$${keysToForcedLabel}`)[0]
  }

  if (forcedRelatedValuePath && rawObjectToFindLabel) {
    try {
      const ownerRefPathSegs = findOwnerReferencePath(
        rawObjectToFindLabel,
        jsonPathToArrayOfRefs, // ".spec.customRef"
        reference,
      )

      const relatedPath =
        forcedRelatedValuePath && ownerRefPathSegs
          ? resolveFormPath(forcedRelatedValuePath, ownerRefPathSegs)
          : undefined

      if (relatedPath) {
        forcedName = _.get(rawObjectToFindLabel, relatedPath)
      }
    } catch {
      // ignore
    }
  }

  if (rawObjectToFindLabel) {
    try {
      const defaultFetched = _.get(rawObjectToFindLabel, ['metadata', 'namespace'])
      const socketFetched = _.get(rawObjectToFindLabel, ['items', 0, 'metadata', 'namespace'])
      objectNamespace = socketFetched || defaultFetched
    } catch {
      // ignore
    }
  }

  return (
    <ResourceLink
      kind={reference.kind}
      apiVersion={reference.apiVersion}
      namespace={forcedNamespace || reference.namespace || objectNamespace}
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
