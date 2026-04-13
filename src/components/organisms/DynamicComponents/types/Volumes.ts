import { CSSProperties } from 'react'

export type TVolumesProps = {
  id: number | string
  baseprefix?: string
  cluster: string
  reqIndex: string
  jsonPathToSpec: string
  jsonPathToPodName?: string
  forcedNamespace?: string
  errorText?: string
  containerStyle?: CSSProperties
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
  baseNavigationPluralName: string
  baseNavigationSpecificName: string
  containerFactoryKey?: string
}
