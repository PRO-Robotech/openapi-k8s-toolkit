import type { TEnrichedTableProviderProps } from 'components/molecules'

export type TEnrichedTableProps = {
  id: number | string
  fetchUrl?: string
  k8sResourceToFetch?: {
    apiGroup?: string
    apiVersion: string
    plural: string
    namespace?: string
  }
  pathToItems: string | string[] // jsonpath or keys as string[]
  additionalReqsDataToEachItem?: number[]
  cluster: string
  labelSelector?: Record<string, string>
  labelSelectorFull?: {
    reqIndex: number
    pathToLabels: string | string[] // jsonpath or keys as string[]
  }
  fieldSelector?: Record<string, string>
  pathToKey?: string // jsonpath for each row
} & Omit<
  TEnrichedTableProviderProps,
  | 'tableMappingsReplaceValues'
  | 'withoutControls'
  | 'cluster'
  | 'theme'
  | 'tableProps'
  | 'dataItems'
  | 'dataForControlsInternal'
>
