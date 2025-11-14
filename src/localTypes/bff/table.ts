import {
  TAdditionalPrinterColumns,
  TAdditionalPrinterColumnsUndefinedValues,
  TAdditionalPrinterColumnsTrimLengths,
  TAdditionalPrinterColumnsColWidths,
  TAdditionalPrinterColumnsKeyTypeProps,
} from 'localTypes/richTable'

export type TPrepareTableReq = {
  customizationId?: string
  tableMappingsReplaceValues?: Record<string, string | undefined>
  forceDefaultAdditionalPrinterColumns?: TAdditionalPrinterColumns
  clusterName: string
  namespace?: string
  k8sResource?: {
    resource: string
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
  additionalPrinterColumnsKeyTypeProps?: TAdditionalPrinterColumnsKeyTypeProps

  pathToNavigate?: string
  recordKeysForNavigation?: string | string[] // jsonpath or keys as string[]
  recordKeysForNavigationSecond?: string | string[] // jsonpath or keys as string[]
  recordKeysForNavigationThird?: string | string[] // jsonpath or keys as string[]
}
