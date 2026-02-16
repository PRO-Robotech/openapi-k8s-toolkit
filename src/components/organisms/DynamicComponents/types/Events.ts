export type TEventsProps = {
  id: number | string
  baseprefix?: string
  cluster: string
  wsUrl: string
  pageSize?: number
  substractHeight?: number
  limit?: number
  labelSelector?: Record<string, string>
  labelSelectorFull?: {
    reqIndex: number
    pathToLabels: string | string[] // jsonpath or keys as string[]
  }
  fieldSelector?: Record<string, string>
  baseFactoryNamespacedAPIKey: string
  baseFactoryClusterSceopedAPIKey: string
  baseFactoryNamespacedBuiltinKey: string
  baseFactoryClusterSceopedBuiltinKey: string
  baseNamespaceFactoryKey: string
  baseNavigationPlural: string
  baseNavigationName: string
}
