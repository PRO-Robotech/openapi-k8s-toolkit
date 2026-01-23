import { CSSProperties } from 'react'

export type TKeyCounterProps = {
  id: number | string
  reqIndex: string
  jsonPathToObj: string
  text: string
  errorText: string
  style?: CSSProperties
}
