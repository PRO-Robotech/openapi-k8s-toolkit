import { CSSProperties } from 'react'

export type TResourceBadgeProps = {
  id: number | string
  value: string // to get color and maybe abbr
  abbreviation?: string
  style?: CSSProperties
}
