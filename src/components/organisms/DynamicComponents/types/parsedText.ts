import { CSSProperties } from 'react'

export type TParsedTextProps = {
  id: number | string
  text: string
  tooltip?: string
  formatter?: 'timestamp'
  style?: CSSProperties
}
