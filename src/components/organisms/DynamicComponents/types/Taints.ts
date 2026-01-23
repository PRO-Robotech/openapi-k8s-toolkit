import { CSSProperties } from 'react'

export type TTaintsProps = {
  id: number | string
  reqIndex: string
  jsonPathToArray: string
  text: string
  errorText: string
  style?: CSSProperties
  notificationSuccessMessage?: string
  notificationSuccessMessageDescription?: string
  modalTitle?: string
  modalDescriptionText?: string
  modalDescriptionTextStyle?: CSSProperties
  inputLabel?: string
  inputLabelStyle?: CSSProperties
  containerStyle?: CSSProperties
  endpoint?: string
  pathToValue?: string
  editModalWidth?: number | string
  cols: number[] // 4
}
