import { CSSProperties } from 'react'
import { FlexProps } from 'antd'

export type TOwnerRefsProps = {
  id: number | string
  baseprefix?: string
  cluster: string
  reqIndex: string // full object for forced labels
  errorText: string
  notArrayErrorText: string
  emptyArrayErrorText: string
  isNotRefsArrayErrorText: string
  containerStyle?: CSSProperties
  listFlexProps?: FlexProps
  jsonPathToArrayOfRefs: string
  forcedApiVersion?: {
    kind: string
    apiVersion: string
  }[]
  forcedNamespace?: string
  keysToForcedLabel?: string | string[] // jsonpath or keys as string[]
  forcedRelatedValuePath?: string
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
  baseNavigationPlural: string
  baseNavigationName: string
}
