import { CSSProperties } from 'react'

export type TTolerationsPermissions = {
  canPatch?: boolean
}

export type TPermissionContext = {
  cluster: string
  namespace?: string
  apiGroup?: string
  plural: string
}

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
  readOnly?: true
  containerStyle?: CSSProperties
}

export type TTolerationsBaseProps = {
  reqIndex: string
  jsonPathToArray: string
  /** Manual permission override. Takes priority over permissionContext. */
  permissions?: TTolerationsPermissions
  /** Resource context for automatic permission checking. */
  permissionContext?: TPermissionContext
}

export type TTolerationsProps = {
  id: number | string
} & TTolerationsBaseProps &
  TTolerationsViewProps &
  TTolerationsModalProps
