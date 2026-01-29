import { CSSProperties } from 'react'
import { TLabelsBaseProps, TLabelsModalProps } from './Labels'
import { TAnnotationsBaseProps, TAnnotationsModalProps } from './Annotations'
import { TTaintsBaseProps, TTaintsModalProps } from './Taints'
import { TTolerationsBaseProps, TTolerationsModalProps } from './Tolerations'

// =============================================================================
// Base Props (shared by all actions)
// =============================================================================

export type TActionBaseProps = {
  icon?: string // Ant Design icon name (e.g., 'StopOutlined', 'TagsOutlined')
  text: string // Button/menu item text
  order?: number // Display order in dropdown (lower = higher in list)
  disabled?: boolean
  tooltip?: string
  danger?: boolean // Show as danger/destructive action
}

export type TActionConfirmProps = {
  confirmTitle?: string
  confirmDescription?: string
  confirmOkText?: string
  confirmCancelText?: string
}

export type TActionNotificationProps = {
  notificationSuccessMessage?: string
  notificationSuccessMessageDescription?: string
  notificationErrorMessage?: string
  notificationErrorMessageDescription?: string
}

/**
 * Simple endpoint action pattern
 * Used by: cordon, uncordon, evict
 */
type TSimpleEndpointActionProps = TActionBaseProps &
  TActionConfirmProps &
  TActionNotificationProps & {
    endpoint: string
  }

/**
 * Patch action pattern
 * Used by: suspend, resume, rolloutRestart
 */
type TPatchActionProps = TSimpleEndpointActionProps & {
  pathToValue: string
}

/**
 * Modal action base pattern
 * Used by: scale, drain, rollback
 */
type TModalActionBaseProps = TActionBaseProps &
  TActionNotificationProps & {
    endpoint: string
    modalTitle?: string
    modalDescriptionText?: string
    modalDescriptionTextStyle?: CSSProperties
  }

/**
 * Data reader action pattern
 * Used by: triggerRun, deleteChildren, downloadAsFiles
 */
type TDataReaderActionProps = TActionBaseProps &
  TActionConfirmProps &
  TActionNotificationProps & {
    reqIndex: string
  }

/**
 * Edit: Navigate to resource edit/form page
 */
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

// =============================================================================
// Edit Metadata Actions
// =============================================================================

export type TEditLabelsActionProps = TActionBaseProps & TLabelsBaseProps & TLabelsModalProps

export type TEditAnnotationsActionProps = TActionBaseProps & TAnnotationsBaseProps & TAnnotationsModalProps

export type TEditTaintsActionProps = TActionBaseProps & TTaintsBaseProps & TTaintsModalProps

export type TEditTolerationsActionProps = TActionBaseProps & TTolerationsBaseProps & TTolerationsModalProps

export type TCordonActionProps = TSimpleEndpointActionProps

export type TUncordonActionProps = TSimpleEndpointActionProps

export type TEvictActionProps = TSimpleEndpointActionProps

export type TSuspendActionProps = TPatchActionProps

export type TResumeActionProps = TPatchActionProps

export type TRolloutRestartActionProps = TPatchActionProps

export type TScaleActionProps = TModalActionBaseProps & {
  reqIndex: string
  jsonPathToCurrentReplicas: string
  min?: number
  max?: number
  inputLabel?: string
}

/** Drain: Evict all pods from node with options */
export type TDrainActionProps = TModalActionBaseProps & {
  defaultIgnoreDaemonSets?: boolean
  defaultDeleteEmptyDirData?: boolean
  defaultForce?: boolean
  defaultTimeout?: number // seconds
}

/** Rollback: Select revision and rollback (Deployment/StatefulSet/DaemonSet) */
export type TRollbackActionProps = TModalActionBaseProps & {
  reqIndex: string
  jsonPathToRevisions: string
}

// =============================================================================
// Data Reader Actions (read data → confirm → execute)
// =============================================================================

/** Trigger Run: Create Job manually from CronJob template */
export type TTriggerRunActionProps = TDataReaderActionProps & {
  endpoint: string
  jsonPathToJobTemplate: string
}

/** Delete Children: Delete child pods/jobs (Job/CronJob) */
export type TDeleteChildrenActionProps = TDataReaderActionProps & {
  endpoint: string
  jsonPathToChildren: string
  childrenType: 'pods' | 'jobs'
}

/** Download as Files: Download ConfigMap/Secret data as files */
export type TDownloadAsFilesActionProps = TActionBaseProps & {
  reqIndex: string
  jsonPathToData: string
  filenamePrefix?: string
  downloadAsZip?: boolean
}

// Generic Patch Action
export type TGenericPatchActionProps = TActionBaseProps &
  TActionConfirmProps &
  TActionNotificationProps & {
    endpoint: string
    pathToValue: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    valueToSubmit: any
  }

export type TActionUnion =
  // Navigation actions
  | { type: 'edit'; props: TEditActionProps }
  // Edit metadata actions
  | { type: 'editLabels'; props: TEditLabelsActionProps }
  | { type: 'editAnnotations'; props: TEditAnnotationsActionProps }
  | { type: 'editTaints'; props: TEditTaintsActionProps }
  | { type: 'editTolerations'; props: TEditTolerationsActionProps }
  // Simple endpoint actions
  | { type: 'cordon'; props: TCordonActionProps }
  | { type: 'uncordon'; props: TUncordonActionProps }
  | { type: 'evict'; props: TEvictActionProps }
  // Patch actions
  | { type: 'suspend'; props: TSuspendActionProps }
  | { type: 'resume'; props: TResumeActionProps }
  | { type: 'rolloutRestart'; props: TRolloutRestartActionProps }
  // Modal actions
  | { type: 'scale'; props: TScaleActionProps }
  | { type: 'drain'; props: TDrainActionProps }
  | { type: 'rollback'; props: TRollbackActionProps }
  // Data reader actions
  | { type: 'triggerRun'; props: TTriggerRunActionProps }
  | { type: 'deleteChildren'; props: TDeleteChildrenActionProps }
  | { type: 'downloadAsFiles'; props: TDownloadAsFilesActionProps }
  // Generic
  | { type: 'genericPatch'; props: TGenericPatchActionProps }

export type TActionsDropdownProps = {
  id: number | string
  buttonText?: string
  buttonIcon?: string
  containerStyle?: CSSProperties
  actions: TActionUnion[]
}
