/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Key } from 'react'

export type TTableRecord = Record<PropertyKey, any> & {
  key?: Key
}

export type TInternalDataForControls = {
  cluster: string
  pathPrefix: string
  apiGroupAndVersion: string
  plural: string
  name: string
  backlink: string
  namespace?: string
  syntheticProject?: string
  deletePathPrefix: string
  onDeleteHandle: (name: string, endpoint: string) => void
  permissions?: {
    canUpdate?: boolean
    canDelete?: boolean
  }
}
