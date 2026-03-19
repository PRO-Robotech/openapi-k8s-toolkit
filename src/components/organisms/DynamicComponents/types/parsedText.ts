import { CSSProperties } from 'react'

export type TParsedTextProps = {
  id: number | string
  text: string
  tooltip?: string
  formatter?: 'timestamp'
  style?: CSSProperties
  /** Which request index this molecule depends on (for per-request error isolation) */
  reqIndex?: string
}
