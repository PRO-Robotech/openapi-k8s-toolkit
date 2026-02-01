export type TCoreCanonicalUnit = 'core' | 'mcore' | 'ucore' | 'ncore'

export type TCoreUnitInput = string | TCoreCanonicalUnit

export type TCoreConvertOptions = {
  format?: boolean
  /** If false and format=true, return formatted number without unit */
  showUnit?: boolean
  precision?: number
  locale?: string
}
