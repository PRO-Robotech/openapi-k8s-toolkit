import { CSSProperties } from 'react'

export type TArrayOfObjectsToKeyValuesProps = {
  id: number | string
  reqIndex: string
  jsonPathToArray: string
  keyFieldName: string
  valueFieldName: string
  separator?: string
  containerStyle?: CSSProperties
  rowStyle?: CSSProperties
  keyFieldStyle?: CSSProperties
  valueFieldStyle?: CSSProperties
}
