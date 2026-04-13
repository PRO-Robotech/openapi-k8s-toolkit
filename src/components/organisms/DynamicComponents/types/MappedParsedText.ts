import { CSSProperties } from 'react'

export type TMappedParsedTextProps = {
  id: number | string
  value: string
  valueMap: Record<string, string>
  style?: CSSProperties
}
