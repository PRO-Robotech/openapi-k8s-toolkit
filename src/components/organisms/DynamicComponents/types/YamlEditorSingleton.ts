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
}
