import { CSSProperties } from 'react'

export type TUsageGraphCardDatum = {
  value: number
  label?: string | number
}

export type TUsageGraphCardProps = {
  title?: string
  series?: TUsageGraphCardDatum[] // can be provided straight forward
  containerStyle?: CSSProperties
  /* colors */
  minColor?: string
  midColor?: string
  maxColor?: string
  /* gradient bar */
  requested?: number
  used?: number
  limit?: number
  /* prom */
  baseUrl?: string
  query?: string
  refetchInterval?: number | false
  range?: string
}
