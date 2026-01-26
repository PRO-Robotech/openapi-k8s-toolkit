import { CSSProperties } from 'react'
import { FlexProps, SelectProps } from 'antd'

export type TLabelModalProps = {
  notificationSuccessMessage?: string
  notificationSuccessMessageDescription?: string
  modalTitle?: string
  modalDescriptionText?: string
  modalDescriptionTextStyle?: CSSProperties
  inputLabel?: string
  inputLabelStyle?: CSSProperties
  maxEditTagTextLength?: number
  allowClearEditSelect?: boolean
  endpoint?: string
  pathToValue?: string
  editModalWidth?: number | string
  paddingContainerEnd?: string
}

export type TLabelViewProps = {
  linkPrefix?: string
  selectProps?: SelectProps
  maxTagKeyLength?: number
  maxTagValueLength?: number
  verticalViewList?: boolean
  verticalViewListFlexProps?: FlexProps
  emptyListMessage?: string
  emptyListMessageStyle?: CSSProperties
  readOnly?: true
  containerStyle?: CSSProperties
}

export type TLabelBaseProps = {
  reqIndex: string
  jsonPathToLabels: string
}

export type TLabelsProps = {
  id: number | string
} & TLabelBaseProps &
  TLabelViewProps &
  TLabelModalProps
