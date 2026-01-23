import { CSSProperties } from 'react'
import { FlexProps, SelectProps } from 'antd'

export type TLabelsProps = {
  id: number | string
  reqIndex: string
  jsonPathToLabels: string
  linkPrefix?: string
  selectProps?: SelectProps
  maxTagKeyLength?: number
  maxTagValueLength?: number
  verticalViewList?: boolean
  verticalViewListFlexProps?: FlexProps
  emptyListMessage?: string
  emptyListMessageStyle?: CSSProperties
  readOnly?: true
  notificationSuccessMessage?: string
  notificationSuccessMessageDescription?: string
  modalTitle?: string
  modalDescriptionText?: string
  modalDescriptionTextStyle?: CSSProperties
  inputLabel?: string
  inputLabelStyle?: CSSProperties
  containerStyle?: CSSProperties
  maxEditTagTextLength?: number
  allowClearEditSelect?: boolean
  endpoint?: string
  pathToValue?: string
  editModalWidth?: number | string
  paddingContainerEnd?: string
}
