import { CSSProperties } from 'react'

export type TTaintsModalProps = {
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
  cols: number[] // 4
}

export type TTaintsViewProps = {
  text: string
  errorText: string
  style?: CSSProperties
  containerStyle?: CSSProperties
}

export type TTaintsBaseProps = {
  reqIndex: string
  jsonPathToArray: string
}

export type TTaintsProps = {
  id: number | string
} & TTaintsBaseProps &
  TTaintsViewProps &
  TTaintsModalProps
