import { CSSProperties } from 'react'

export type TTaintsPermissions = {
  canPatch?: boolean
}

export type TPermissionContext = {
  cluster: string
  namespace?: string
  apiGroup?: string
  plural: string
}

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
  /** Manual permission override. Takes priority over permissionContext. */
  permissions?: TTaintsPermissions
  /** Resource context for automatic permission checking. */
  permissionContext?: TPermissionContext
}

export type TTaintsProps = {
  id: number | string
} & TTaintsBaseProps &
  TTaintsViewProps &
  TTaintsModalProps
