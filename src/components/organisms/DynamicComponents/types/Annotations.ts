import { CSSProperties } from 'react'

export type TAnnotationsProps = {
  id: number | string
  reqIndex: string
  jsonPathToObj: string
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
  cols: number[] // 3
}
