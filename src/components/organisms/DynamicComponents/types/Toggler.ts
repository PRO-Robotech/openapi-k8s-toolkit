import { CSSProperties } from 'react'

export type TTogglerProps = {
  id: number | string
  reqIndex: string
  jsonPathToValue: string
  criteria: {
    type: 'forSuccess' | 'forError'
    operator: 'exists' | 'equals'
    valueToCompare?: string
  }
  notificationSuccessMessage?: string
  notificationErrorMessage?: string
  notificationSuccessMessageDescription?: string
  notificationErrorMessageDescription?: string
  containerStyle?: CSSProperties
  endpoint: string
  pathToValue: string
  valueToSubmit: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onValue: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    offValue?: any
    toRemoveWhenOff?: boolean
  }
}
