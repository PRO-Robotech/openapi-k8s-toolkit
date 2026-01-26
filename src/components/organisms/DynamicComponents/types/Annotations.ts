import { CSSProperties } from 'react'

export type TAnnotationsModalProps = {
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

export type TAnnotationsViewProps = {
  text: string
  errorText: string
  containerStyle?: CSSProperties
}

export type TAnnotationsBaseProps = {
  reqIndex: string
  jsonPathToObj: string
}

export type TAnnotationsProps = {
  id: number | string
} & TAnnotationsBaseProps &
  TAnnotationsViewProps &
  TAnnotationsModalProps
