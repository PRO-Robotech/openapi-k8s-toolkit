import { CSSProperties } from 'react'
import type { TUnitInput } from 'localTypes/factories/converterBytes'

export type TConverterBytesProps = {
  id: number | string
  bytesValue: string | string[] // reqs
  unit?: TUnitInput // do not enter if wanna auto format
  /** If true, returns "12.3 GiB" instead of just 12.3 */
  format?: boolean
  /** Max fraction digits when formatting (default 2) */
  precision?: number
  /** Locale for number formatting (default: undefined => user agent) */
  locale?: string
  standard?: 'si' | 'iec'
  notANumberText?: string
  style?: CSSProperties
  /** If provided, value is in this unit instead of raw bytes */
  fromUnit?: TUnitInput
  /** If provided, convert to this explicit unit */
  toUnit?: TUnitInput // do not enter if wanna auto format
  /** If omitted and toUnit is missing, use auto-scaling */
}
