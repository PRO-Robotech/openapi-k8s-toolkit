export type TStatusTextProps = {
  id: number | string
  values: string[] // array of reqsJsonPath
  criteriaSuccess: 'equals' | 'notEquals'
  criteriaError: 'equals' | 'notEquals'
  strategySuccess?: 'some' | 'every' // every - default
  strategyError?: 'some' | 'every' // every - default
  valueToCompareSuccess: unknown[]
  valueToCompareError: unknown[]
  successText: string
  errorText: string
  fallbackText: string
}
