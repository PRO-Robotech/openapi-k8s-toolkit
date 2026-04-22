/* eslint-disable no-use-before-define */
export type TFormSchemaKnownType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'listInput'
  | 'multilineString'
  | 'multilineStringBase64'
  | 'rangeInputCpu'
  | 'rangeInputMemory'

type TFormSchemaLooseType = TFormSchemaKnownType | (string & {})

/**
 * Mirror of the normalized form-schema contract returned by the BFF.
 * Toolkit components should consume this type instead of raw OpenAPI v2 types.
 */
export interface TFormSchemaNode {
  type?: TFormSchemaLooseType | TFormSchemaLooseType[]
  properties?: TFormSchemaProperties
  items?: TFormSchemaNode
  additionalProperties?: boolean | TFormSchemaNode
  required?: string[]
  enum?: string[]
  default?: unknown
  example?: unknown
  description?: string
  customProps?: unknown
  isAdditionalProperties?: boolean
  'x-kubernetes-preserve-unknown-fields'?: boolean
  'x-kubernetes-int-or-string'?: boolean
}

export interface TFormSchemaProperties {
  [name: string]: TFormSchemaNode
}
