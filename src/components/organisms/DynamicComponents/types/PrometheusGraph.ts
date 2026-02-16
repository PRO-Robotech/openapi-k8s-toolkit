import { CSSProperties } from 'react'
import type { TDateFormatOptions } from 'utils/converterDates'

export type TPrometheusGraphProps = {
  id: number | string
  type:
    | 'MatrixToAreaMulti'
    | 'MatrixToAreaSingle'
    | 'MatrixToAreaStacked'
    | 'MatrixToLineMulti'
    | 'MatrixToLineSingle'
    | 'MatrixToReducedBar'
    | 'MatrixToTableRows'
    | 'VectorToBarGauge'
    | 'VectorToBarHorizontal'
    | 'VectorToBarVertical'
    | 'VectorToGaugeRadial'
    | 'VectorToPie'
    | 'VectorToTableRows'
    | 'ScalarToGauge'
    | 'ScalarToStat'
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  baseUrl?: string
  query?: string
  refetchInterval?: number | false
  range?: string
  title?: string
  min?: number
  max?: number
  mode?: 'last' | 'avg' | 'sum' | 'max' | 'min'
  topN?: number
  formatter: 'bytes' | 'cores' | 'unit' | 'none'
  unit?: string
  dateFormatter?: TDateFormatOptions
  tableColumns?: {
    series?: boolean
    min?: boolean
    max?: boolean
    mean?: boolean
    current?: boolean
    currentTs?: boolean
    id?: boolean
    value?: boolean
    timestamp?: boolean
  }
}
