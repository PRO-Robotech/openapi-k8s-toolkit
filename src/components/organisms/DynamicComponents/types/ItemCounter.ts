import { CSSProperties } from 'react'

export type TItemCounterProps = {
  id: number | string
  reqIndex: string
  jsonPathToArray: string
  text: string
  errorText: string
  style?: CSSProperties
}
