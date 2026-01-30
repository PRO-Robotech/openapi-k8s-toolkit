import { CSSProperties } from 'react'
import { TLabelsBaseProps, TLabelsModalProps } from './Labels'
import { TAnnotationsBaseProps, TAnnotationsModalProps } from './Annotations'
import { TTaintsBaseProps, TTaintsModalProps } from './Taints'
import { TTolerationsBaseProps, TTolerationsModalProps } from './Tolerations'

export type TActionBaseProps = {
  icon?: string
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

export type TActionUnion =
  | { type: 'edit'; props: TEditActionProps }
  | { type: 'editLabels'; props: TEditLabelsActionProps }
  | { type: 'editAnnotations'; props: TEditAnnotationsActionProps }
  | { type: 'editTaints'; props: TEditTaintsActionProps }
  | { type: 'editTolerations'; props: TEditTolerationsActionProps }

export type TActionsDropdownProps = {
  id: number | string
  buttonText?: string
  buttonIcon?: string
  containerStyle?: CSSProperties
  actions: TActionUnion[]
}
