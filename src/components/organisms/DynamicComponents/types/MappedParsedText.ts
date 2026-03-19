import { CSSProperties } from 'react'

export type TMappedParsedTextProps = {
  id: number | string
  value: string
  valueMap: Record<string, string>
  style?: CSSProperties
  /** Which request index this molecule depends on (for per-request error isolation) */
  reqIndex?: string
}
