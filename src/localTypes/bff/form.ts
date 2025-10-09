/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIV2 } from 'openapi-types'
import { TJSON } from '../JSON'
import { TFormName } from '../form'
import { TFormPrefill } from '../formExtensions'

export type TPrepareFormReq = {
  data:
    | {
        type: 'builtin'
        typeName: string
        prefillValuesSchema?: TJSON
        prefillValueNamespaceOnly?: string
      }
    | {
        type: 'apis'
        apiGroup: string
        apiVersion: string
        typeName: string
        prefillValuesSchema?: TJSON
        prefillValueNamespaceOnly?: string
      }
  clusterName: string
  customizationId?: string
}

export type TPrepareFormRes =
  | {
      result: 'error'
      error: string | undefined
      kindName: string | undefined
      fallbackToManualMode: true
      isNamespaced: boolean
    }
  | {
      result: 'success'
      properties: {
        [name: string]: OpenAPIV2.SchemaObject
      }
      required: string[] | undefined
      hiddenPaths: string[][] | undefined
      expandedPaths: string[][] | undefined
      persistedPaths: string[][] | undefined
      sortPaths: string[][] | undefined
      kindName: string | undefined
      isNamespaced: boolean
      formPrefills?: TFormPrefill
      namespacesData?: string[]
    }

export type TYamlByValuesReq = {
  values: any
  persistedKeys: TFormName[]
  properties: OpenAPIV2.SchemaObject['properties']
}

export type TYamlByValuesRes = any

export type TValuesByYamlReq = {
  values: Record<string, unknown>
  properties: OpenAPIV2.SchemaObject['properties']
}

export type TValuesByYamlRes = any
