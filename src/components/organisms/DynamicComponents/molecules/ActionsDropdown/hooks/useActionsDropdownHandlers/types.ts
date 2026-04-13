import type { TResourceKind } from '../../../../types/ActionsDropdown'

export type TDeleteModalData = {
  name: string
  endpoint: string
  redirectTo?: string
}

export type TEvictModalData = {
  name: string
  endpoint: string
  namespace?: string
  apiVersion: string
  gracePeriodSeconds?: number
  dryRun?: string[]
}

export type TScaleModalData = {
  endpoint: string
  currentReplicas: number
  name: string
  namespace?: string
  apiVersion: string
}

export type TDeleteChildrenModalData = {
  children: { name: string; endpoint: string }[]
  childResourceName: string
}

export type TRerunModalData = {
  createEndpoint: string
  sourceName: string
  sourceSpec: Record<string, unknown>
}

export type TDrainModalData = {
  bffEndpoint: string
  nodeName: string
}

export type TDrainResponse = {
  drained: number
  failed: { name: string; namespace: string; error: string }[]
  skipped: number
}

export type TRollbackModalData = {
  bffEndpoint: string
  resourceName: string
  resourceEndpoint: string
}

export type TParseContext = {
  replaceValues: Record<string, string | undefined>
  multiQueryData: Record<string, unknown>
}

export type TNotificationCallbacks = {
  showSuccess: (label: string) => void
  showError: (label: string, error: unknown) => void
}

export type TCreateFromFilesModalData = {
  createEndpoint: string
  namespace: string
  resourceKind: TResourceKind
  apiVersion: string
}
