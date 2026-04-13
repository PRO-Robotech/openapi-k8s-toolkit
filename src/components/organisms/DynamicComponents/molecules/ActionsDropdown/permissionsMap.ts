import type { TPermissionVerb } from 'localTypes/permissions'
import type { TActionUnion } from '../../types/ActionsDropdown'

export type TRequiredPermission = {
  verb: TPermissionVerb
  subresource?: string
}

export const ACTION_REQUIRED_PERMISSIONS: Record<TActionUnion['type'], TRequiredPermission> = {
  edit: { verb: 'update' },
  editLabels: { verb: 'patch' },
  editAnnotations: { verb: 'patch' },
  editTaints: { verb: 'patch' },
  editTolerations: { verb: 'patch' },
  delete: { verb: 'delete' },
  cordon: { verb: 'patch' },
  uncordon: { verb: 'patch' },
  suspend: { verb: 'patch' },
  resume: { verb: 'patch' },
  rolloutRestart: { verb: 'patch' },
  evict: { verb: 'create', subresource: 'eviction' },
  openKubeletConfig: { verb: 'get', subresource: 'proxy' },
  scale: { verb: 'update', subresource: 'scale' },
  triggerRun: { verb: 'create' },
  deleteChildren: { verb: 'delete' },
  rerunLast: { verb: 'create' },
  drain: { verb: 'patch' },
  rollback: { verb: 'patch' },
  downloadAsFiles: { verb: 'get' },
  createFromFiles: { verb: 'create' },
}
