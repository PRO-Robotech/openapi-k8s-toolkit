import { CSSProperties } from 'react'

export type TResourceBadgeProps = {
  id: number | string
  value: string // to get color and maybe abbr
  abbreviation?: string
  style?: CSSProperties
  /** Which request index this molecule depends on (for per-request error isolation) */
  reqIndex?: string
}
