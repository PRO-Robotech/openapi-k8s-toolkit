import { CSSProperties } from 'react'
import { TConverterBytesProps } from './ConverterBytes'
import { TConverterCoresProps } from './ConverterCores'

export type TUsageGraphCardDatum = {
  value: number
  label?: string | number
}

export type TUsageGraphCardProps = {
  title?: string // default: 'CPU, core'
  series?: TUsageGraphCardDatum[] // can be provided straight forward
  containerStyle?: CSSProperties
  valueStrategy?: 'cpu' | 'memory' | 'bytes'
  valuePrecision?: number // default 2
  hideUnit?: boolean // default true
  converterBytesProps?: Partial<Omit<TConverterBytesProps, 'id' | 'bytesValue'>>
  converterCoresProps?: Partial<Omit<TConverterCoresProps, 'id' | 'coresValue'>>
  /* colors; defaults are provided */
  minColor?: string
  midColor?: string
  maxColor?: string
  /* gradient bar */
  requested?: number
  requestedQuery?: string
  used?: number
  usedQuery?: string
  limit?: number
  limitQuery?: string
  /* prom */
  baseUrl?: string
  query?: string
  refetchInterval?: number | false // default: 30_000
  range?: string // default: 1h
}
