import { CSSProperties } from 'react'
import type { TCoreUnitInput } from 'localTypes/factories/converterCores'

export type TConverterCoresProps = {
  id: number | string
  /** Raw text that may contain a number or number+unit like "0.5", "500m", "2 vcpu" */
  coresValue: string | string[]
  /** Target unit; omit to auto format (core vs mcore) */
  unit?: TCoreUnitInput
  /** If true, returns "500 mcore" instead of just 500 */
  format?: boolean
  /** Max fraction digits when formatting (default 2) */
  precision?: number
  /** Locale for number formatting (default: undefined => user agent) */
  locale?: string
  notANumberText?: string
  style?: CSSProperties
  /** If provided, value is in this unit instead of raw "cores" */
  fromUnit?: TCoreUnitInput
  /** If provided, convert to this explicit unit; omit for auto-format */
  toUnit?: TCoreUnitInput
  /** If omitted and toUnit is missing, use auto-scaling (core vs mcore) */
}
