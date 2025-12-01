export type TAdditionalPrinterColumns = {
  name: string
  jsonPath?: string
  type?: string // 'flatMap' expands a map object into multiple rows (one per key-value pair)
  customProps?: unknown
}[]

export type TAdditionalPrinterColumnsUndefinedValues = {
  key: string
  value: string
}[]

export type TAdditionalPrinterColumnsTrimLengths = {
  key: string
  value: number
}[]

export type TAdditionalPrinterColumnsColWidths = {
  key: string
  value: string
}[]

export type TAdditionalPrinterColumnsKeyTypeProps = Record<
  string,
  {
    type: string
    customProps?: unknown
  }
>

export type TAdditionalPrinterColumnsDisableSortersAndFilters = React.Key[]
