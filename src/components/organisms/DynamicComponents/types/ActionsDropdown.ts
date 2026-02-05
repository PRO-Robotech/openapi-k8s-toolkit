import { CSSProperties } from 'react'
import * as AntIcons from '@ant-design/icons'
import { TLabelsBaseProps, TLabelsModalProps } from './Labels'
import { TAnnotationsBaseProps, TAnnotationsModalProps } from './Annotations'
import { TTaintsBaseProps, TTaintsModalProps } from './Taints'
import { TTolerationsBaseProps, TTolerationsModalProps } from './Tolerations'

type TAntIconName = Exclude<keyof typeof AntIcons, 'createFromIconfontCN'>

export type TActionBaseProps = {
  icon?: TAntIconName
  iconBase64Encoded?: string
  text: string
  disabled?: boolean
  tooltip?: string
  danger?: boolean
}

export type TEditActionProps = TActionBaseProps & {
  cluster: string
  namespace?: string
  syntheticProject?: string
  apiGroup?: string
  apiVersion: string
  plural: string
  name: string
  baseprefix?: string
}

export type TEditLabelsActionProps = TActionBaseProps & TLabelsBaseProps & TLabelsModalProps

export type TEditAnnotationsActionProps = TActionBaseProps & TAnnotationsBaseProps & TAnnotationsModalProps

export type TEditTaintsActionProps = TActionBaseProps & TTaintsBaseProps & TTaintsModalProps

export type TEditTolerationsActionProps = TActionBaseProps & TTolerationsBaseProps & TTolerationsModalProps

export type TDeleteActionProps = TActionBaseProps & {
  endpoint: string
  name: string
  redirectTo?: string
}

export type TActionUnion =
  | { type: 'edit'; props: TEditActionProps }
  | { type: 'editLabels'; props: TEditLabelsActionProps }
  | { type: 'editAnnotations'; props: TEditAnnotationsActionProps }
  | { type: 'editTaints'; props: TEditTaintsActionProps }
  | { type: 'editTolerations'; props: TEditTolerationsActionProps }
  | { type: 'delete'; props: TDeleteActionProps }

export type TActionsPermissions = {
  canUpdate?: boolean
  canPatch?: boolean
  canDelete?: boolean
}

export type TPermissionContext = {
  cluster: string
  namespace?: string
  apiGroup?: string
  plural: string
  subresource?: string
}

export type TActionsDropdownProps = {
  id: number | string
  buttonText?: string
  buttonIcon?: string
  buttonVariant?: 'default' | 'icon'
  containerStyle?: CSSProperties
  actions: TActionUnion[]
  /** Manual permission override. Takes priority over permissionContext. */
  permissions?: TActionsPermissions
  /** Resource context for automatic permission checking. */
  permissionContext?: TPermissionContext
}
