export type TYamlEditorSingletonPermissions = {
  canUpdate?: boolean
}

export type TPermissionContext = {
  cluster: string
  namespace?: string
  apiGroup?: string
  plural: string
}

export type TYamlEditorSingletonProps = {
  id: number | string
  cluster: string
  isNameSpaced: boolean
  type: 'builtin' | 'apis'
  apiGroup?: string
  apiVersion?: string
  plural: string
  forcedKind?: string
  prefillValuesRequestIndex: number
  pathToData?: string | string[] // jsonpath or keys as string[]
  substractHeight?: number
  readOnly?: boolean
  /** Manual permission override. Takes priority over permissionContext. */
  permissions?: TYamlEditorSingletonPermissions
  /** Resource context for automatic permission checking. */
  permissionContext?: TPermissionContext
}
