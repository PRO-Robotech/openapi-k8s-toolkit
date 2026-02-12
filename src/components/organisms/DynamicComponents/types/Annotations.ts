import { CSSProperties } from 'react'

export type TAnnotationsPermissions = {
  canPatch?: boolean
}

export type TPermissionContext = {
  cluster: string
  namespace?: string
  apiGroup?: string
  plural: string
}

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
  readOnly?: true
  containerStyle?: CSSProperties
}

export type TAnnotationsBaseProps = {
  reqIndex: string
  jsonPathToObj: string
  /** Manual permission override. Takes priority over permissionContext. */
  permissions?: TAnnotationsPermissions
  /** Resource context for automatic permission checking. */
  permissionContext?: TPermissionContext
}

export type TAnnotationsProps = {
  id: number | string
} & TAnnotationsBaseProps &
  TAnnotationsViewProps &
  TAnnotationsModalProps
