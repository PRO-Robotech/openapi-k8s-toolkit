import { CSSProperties } from 'react'

export type TTolerationsModalProps = {
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

export type TTolerationsViewProps = {
  text: string
  errorText: string
  containerStyle?: CSSProperties
}

export type TTolerationsBaseProps = {
  reqIndex: string
  jsonPathToArray: string
}

export type TTolerationsProps = {
  id: number | string
} & TTolerationsBaseProps &
  TTolerationsViewProps &
  TTolerationsModalProps
