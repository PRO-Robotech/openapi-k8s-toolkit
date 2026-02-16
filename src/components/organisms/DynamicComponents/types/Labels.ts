import { CSSProperties } from 'react'
import { FlexProps, SelectProps } from 'antd'

export type TLabelsPermissions = {
  canPatch?: boolean
}

export type TPermissionContext = {
  cluster: string
  namespace?: string
  apiGroup?: string
  plural: string
}

export type TLabelsModalProps = {
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

export type TLabelsViewProps = {
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

export type TLabelsBaseProps = {
  reqIndex: string
  jsonPathToLabels: string
  /** Manual permission override. Takes priority over permissionContext. */
  permissions?: TLabelsPermissions
  /** Resource context for automatic permission checking. */
  permissionContext?: TPermissionContext
}

export type TLabelsProps = {
  id: number | string
} & TLabelsBaseProps &
  TLabelsViewProps &
  TLabelsModalProps
