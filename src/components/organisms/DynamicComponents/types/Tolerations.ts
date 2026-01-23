import { CSSProperties } from 'react'

export type TTolerationsProps = {
  id: number | string
  reqIndex: string
  jsonPathToArray: string
  text: string
  errorText: string
  containerStyle?: CSSProperties
  notificationSuccessMessage?: string
  notificationSuccessMessageDescription?: string
  modalTitle?: string
  modalDescriptionText?: string
  modalDescriptionTextStyle?: CSSProperties
  inputLabel?: string
  inputLabelStyle?: CSSProperties
  endpoint?: string
  pathToValue?: string
  editModalWidth?: number | string
  cols: number[] // 5
}
