export type TCoreCanonicalUnit = 'core' | 'mcore' | 'ucore' | 'ncore'

export type TCoreUnitInput = string | TCoreCanonicalUnit

export type TCoreConvertOptions = {
  format?: boolean
  precision?: number
  locale?: string
}
