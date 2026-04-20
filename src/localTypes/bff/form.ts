/* eslint-disable @typescript-eslint/no-explicit-any */
import { TJSON } from '../JSON'
import { TFormName } from '../form'
import { TFormPrefill } from '../formExtensions'
import { TFormSchemaProperties } from '../formSchema'

export type TPrepareFormReq = {
  data:
    | {
        type: 'builtin'
        plural: string
        prefillValuesSchema?: TJSON
        prefillValueNamespaceOnly?: string
      }
    | {
        type: 'apis'
        apiGroup: string
        apiVersion: string
        plural: string
        prefillValuesSchema?: TJSON
        prefillValueNamespaceOnly?: string
      }
  cluster: string
  partsOfUrl: string[]
  customizationId?: string
  customizationIdPrefill?: string
}

export type TPrepareFormRes =
  | {
      result: 'error'
      error: string | undefined
      kind: string | undefined
      fallbackToManualMode: true
      forceViewMode?: 'OpenAPI' | 'Manual'
      isNamespaced: boolean
    }
  | {
      result: 'success'
      properties: TFormSchemaProperties
      required: string[] | undefined
      hiddenPaths: string[][] | undefined
      expandedPaths: string[][] | undefined
      persistedPaths: string[][] | undefined
      sortPaths: string[][] | undefined
      kind: string | undefined
      isNamespaced: boolean
      forceViewMode?: 'OpenAPI' | 'Manual'
      formPrefills?: TFormPrefill
      namespacesData?: string[]
    }

export type TYamlByValuesReq = {
  values: any
  persistedKeys: TFormName[]
  properties: TFormSchemaProperties
}

export type TYamlByValuesRes = any

export type TValuesByYamlReq = {
  values: Record<string, unknown>
  properties: TFormSchemaProperties
}

export type TValuesByYamlRes = any
