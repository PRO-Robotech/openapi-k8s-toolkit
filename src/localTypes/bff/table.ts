import {
  TAdditionalPrinterColumns,
  TAdditionalPrinterColumnsUndefinedValues,
  TAdditionalPrinterColumnsTrimLengths,
  TAdditionalPrinterColumnsColWidths,
  TAdditionalPrinterColumnsTooltips,
  TAdditionalPrinterColumnsKeyTypeProps,
  TAdditionalPrinterColumnsCustomSortersAndFilters,
} from 'localTypes/richTable'

export type TPrepareTableReq = {
  customizationId?: string
  tableMappingsReplaceValues?: Record<string, string | undefined>
  forceDefaultAdditionalPrinterColumns?: TAdditionalPrinterColumns
  cluster: string
  namespace?: string
  k8sResource?: {
    plural: string
    apiGroup?: string
    apiVersion: string
  }
  // namespaceScopedWithoutNamespace?: boolean
}

export type TPrepareTableRes = {
  additionalPrinterColumns: TAdditionalPrinterColumns
  additionalPrinterColumnsUndefinedValues?: TAdditionalPrinterColumnsUndefinedValues
  additionalPrinterColumnsTrimLengths?: TAdditionalPrinterColumnsTrimLengths
  additionalPrinterColumnsColWidths?: TAdditionalPrinterColumnsColWidths
  additionalPrinterColumnsTooltips?: TAdditionalPrinterColumnsTooltips
  additionalPrinterColumnsKeyTypeProps?: TAdditionalPrinterColumnsKeyTypeProps
  additionalPrinterColumnsCustomSortersAndFilters?: TAdditionalPrinterColumnsCustomSortersAndFilters
  withoutControls?: boolean

  pathToNavigate?: string
  recordKeysForNavigation?: string | string[] // jsonpath or keys as string[]
  recordKeysForNavigationSecond?: string | string[] // jsonpath or keys as string[]
  recordKeysForNavigationThird?: string | string[] // jsonpath or keys as string[]
}
