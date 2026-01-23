import { CSSProperties } from 'react'

export type TTogglerSegmentedProps = {
  id: number | string
  reqIndex: string
  jsonPathToValue: string
  notificationSuccessMessage?: string
  notificationErrorMessage?: string
  notificationSuccessMessageDescription?: string
  notificationErrorMessageDescription?: string
  containerStyle?: CSSProperties
  endpoint: string
  pathToValue: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  possibleValues: any[]
  valuesMap?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
    renderedValue: string | number
  }[]
}
