import { CSSProperties } from 'react'
import * as AntIcons from '@ant-design/icons'
import { TLabelsBaseProps, TLabelsModalProps } from './Labels'
import { TAnnotationsBaseProps, TAnnotationsModalProps } from './Annotations'
import { TTaintsBaseProps, TTaintsModalProps } from './Taints'
import { TTolerationsBaseProps, TTolerationsModalProps } from './Tolerations'

type TAntIconName = Exclude<keyof typeof AntIcons, 'createFromIconfontCN'>

export type TActionVisibilityCriteria = 'equals' | 'notEquals' | 'exists' | 'notExists'

export type TActionVisibility = {
  value: string
  criteria: TActionVisibilityCriteria
  valueToCompare?: string | string[]
}

export type TPermissionContext = {
  cluster: string
  namespace?: string
  apiGroup?: string
  plural: string
  subresource?: string
}

export type TActionBaseProps = {
  icon?: TAntIconName
  iconBase64Encoded?: string
  text: string
  disabled?: boolean
  tooltip?: string
  danger?: boolean
  visibleWhen?: TActionVisibility
  permissionContext?: TPermissionContext
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

export type TPatchFieldActionProps = TActionBaseProps & {
  endpoint: string
  pathToValue: string
  value: unknown
}

export type TRolloutRestartActionProps = TActionBaseProps & {
  endpoint: string
  annotationKey?: string
  timestamp?: string
}

export type TEvictActionProps = TActionBaseProps & {
  endpoint: string
  name: string
  namespace?: string
  apiVersion?: string
  gracePeriodSeconds?: number
  dryRun?: string[]
}

export type TOpenKubeletConfigActionProps = TActionBaseProps & {
  url: string
  modalTitle?: string
  modalDescriptionText?: string
  editModalWidth?: number | string
}

export type TScaleActionProps = TActionBaseProps & {
  endpoint: string
  currentReplicas: string
  name: string
  namespace?: string
  apiVersion?: string
}

export type TTriggerRunActionProps = TActionBaseProps & {
  createEndpoint: string
  cronJobName: string
  jobTemplate: string
}

export type TDeleteChildrenActionProps = TActionBaseProps & {
  children: string
  childResourceName: string
}

export type TRerunLastActionProps = TActionBaseProps & {
  createEndpoint: string
  sourceJobSpec: string
  sourceJobName: string
}

export type TDrainActionProps = TActionBaseProps & {
  bffEndpoint: string
  nodeName: string
}

export type TRollbackActionProps = TActionBaseProps & {
  bffEndpoint: string
  resourceName: string
  resourceEndpoint: string
}

export type TResourceKind = 'ConfigMap' | 'Secret'

export type TDownloadAsFilesActionProps = TActionBaseProps & {
  endpoint: string
  resourceKind: TResourceKind
  name: string
}

export type TCreateFromFilesActionProps = TActionBaseProps & {
  createEndpoint: string
  namespace: string
  resourceKind: TResourceKind
  apiVersion?: string
}

export type TActionUnion =
  | { type: 'edit'; props: TEditActionProps }
  | { type: 'editLabels'; props: TEditLabelsActionProps }
  | { type: 'editAnnotations'; props: TEditAnnotationsActionProps }
  | { type: 'editTaints'; props: TEditTaintsActionProps }
  | { type: 'editTolerations'; props: TEditTolerationsActionProps }
  | { type: 'delete'; props: TDeleteActionProps }
  | { type: 'cordon'; props: TPatchFieldActionProps }
  | { type: 'uncordon'; props: TPatchFieldActionProps }
  | { type: 'suspend'; props: TPatchFieldActionProps }
  | { type: 'resume'; props: TPatchFieldActionProps }
  | { type: 'rolloutRestart'; props: TRolloutRestartActionProps }
  | { type: 'evict'; props: TEvictActionProps }
  | { type: 'openKubeletConfig'; props: TOpenKubeletConfigActionProps }
  | { type: 'scale'; props: TScaleActionProps }
  | { type: 'triggerRun'; props: TTriggerRunActionProps }
  | { type: 'deleteChildren'; props: TDeleteChildrenActionProps }
  | { type: 'rerunLast'; props: TRerunLastActionProps }
  | { type: 'drain'; props: TDrainActionProps }
  | { type: 'rollback'; props: TRollbackActionProps }
  | { type: 'downloadAsFiles'; props: TDownloadAsFilesActionProps }
  | { type: 'createFromFiles'; props: TCreateFromFilesActionProps }

/** Per-action permission map. Key = "${actionType}-${index}", value = whether action is allowed. */
export type TActionsPermissions = Record<string, boolean | undefined>

export type TActionsDropdownProps = {
  id: number | string
  buttonText?: string
  buttonVariant?: 'default' | 'icon'
  containerStyle?: CSSProperties
  actions: TActionUnion[]
  /** Manual permission override. Takes priority over per-action permissionContext. */
  permissions?: TActionsPermissions
}
