/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
// import { Form, Button, Alert } from 'antd'
import { Form, Button } from 'antd'
import { OpenAPIV2 } from 'openapi-types'
import { getStringByName } from 'utils/getStringByName'
import { TListInputCustomProps, TRangeInputCustomProps } from 'localTypes/formExtensions'
import { TFormName, TExpandedControls, TNamespaceData, TPersistedControls, TUrlParams } from 'localTypes/form'
import { PlusIcon } from 'components/atoms'
import { deepMerge } from 'utils/deepMerge'
import { getSortedPropertyKeys } from './helpers/getSortedPropertyKeys'
import { ResetedFormItem, ArrayInsideContainer, HiddenContainer } from '../../atoms'
import {
  FormNamespaceInput,
  FormStringInput,
  FormEnumStringInput,
  FormNumberInput,
  FormRangeInput,
  FormListInput,
  FormBooleanInput,
  FormObjectFromSwagger,
  FormArrayHeader,
  FormInlineYamlEditor,
} from '../../molecules'
import { Styled } from './styled'

export const getStringFormItemFromSwagger = ({
  name,
  arrKey,
  arrName,
  persistName,
  required,
  forceNonRequired,
  description,
  namespaceData,
  isAdditionalProperties,
  removeField,
  persistedControls,
  onRemoveByMinus,
}: {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  persistName?: TFormName
  required?: string[]
  forceNonRequired?: boolean
  description?: string
  namespaceData?: TNamespaceData
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  persistedControls: TPersistedControls
  onRemoveByMinus?: () => void
}) => {
  if (Array.isArray(name) && name.length === 2 && name[0] === 'metadata' && name[1] === 'namespace' && namespaceData) {
    return (
      <FormNamespaceInput
        name={name}
        key={`${arrKey}-${JSON.stringify(name)}-namespace`}
        namespaceData={namespaceData}
        isAdditionalProperties={isAdditionalProperties}
        removeField={removeField}
      />
    )
  }

  return (
    <FormStringInput
      name={name}
      arrKey={arrKey}
      key={`${arrKey}-${JSON.stringify(name)}`}
      arrName={arrName}
      persistName={persistName}
      required={required}
      forceNonRequired={forceNonRequired}
      description={description}
      isAdditionalProperties={isAdditionalProperties}
      removeField={removeField}
      persistedControls={persistedControls}
      onRemoveByMinus={onRemoveByMinus}
    />
  )
}

export const getEnumStringFormItemFromSwagger = ({
  name,
  arrKey,
  arrName,
  persistName,
  required,
  forceNonRequired,
  description,
  isAdditionalProperties,
  removeField,
  options,
  persistedControls,
  onRemoveByMinus,
}: {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  persistName?: TFormName
  required?: string[]
  forceNonRequired?: boolean
  description?: string
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  options: string[]
  persistedControls: TPersistedControls
  onRemoveByMinus?: () => void
}) => {
  return (
    <FormEnumStringInput
      name={name}
      arrKey={arrKey}
      key={`${arrKey}-${JSON.stringify(name)}`}
      arrName={arrName}
      persistName={persistName}
      required={required}
      forceNonRequired={forceNonRequired}
      description={description}
      isAdditionalProperties={isAdditionalProperties}
      removeField={removeField}
      options={options}
      persistedControls={persistedControls}
      onRemoveByMinus={onRemoveByMinus}
    />
  )
}

export const getNumberFormItemFromSwagger = ({
  isNumber,
  name,
  arrKey,
  arrName,
  persistName,
  required,
  forceNonRequired,
  description,
  isAdditionalProperties,
  removeField,
  persistedControls,
  onRemoveByMinus,
}: {
  isNumber?: boolean
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  persistName?: TFormName
  required?: string[]
  forceNonRequired?: boolean
  description?: string
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  persistedControls: TPersistedControls
  onRemoveByMinus?: () => void
}) => {
  return (
    <FormNumberInput
      isNumber={isNumber}
      name={name}
      arrKey={arrKey}
      key={`${arrKey}-${JSON.stringify(name)}`}
      arrName={arrName}
      persistName={persistName}
      required={required}
      forceNonRequired={forceNonRequired}
      description={description}
      isAdditionalProperties={isAdditionalProperties}
      removeField={removeField}
      persistedControls={persistedControls}
      onRemoveByMinus={onRemoveByMinus}
    />
  )
}

export const getRangeInputFormItemFromSwagger = ({
  name,
  arrKey,
  arrName,
  persistName,
  required,
  forceNonRequired,
  description,
  isEdit,
  persistedControls,
  customProps,
  urlParams,
  onRemoveByMinus,
}: {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  persistName?: TFormName
  required?: string[]
  forceNonRequired?: boolean
  description?: string
  isEdit: boolean
  persistedControls: TPersistedControls
  customProps: TRangeInputCustomProps
  urlParams: TUrlParams
  onRemoveByMinus?: () => void
}) => {
  return (
    <FormRangeInput
      name={name}
      arrKey={arrKey}
      key={`${arrKey}-${JSON.stringify(name)}`}
      arrName={arrName}
      persistName={persistName}
      required={required}
      forceNonRequired={forceNonRequired}
      description={description}
      isEdit={isEdit}
      customProps={customProps}
      persistedControls={persistedControls}
      urlParams={urlParams}
      onRemoveByMinus={onRemoveByMinus}
    />
  )
}

export const getListInputFormItemFromSwagger = ({
  name,
  arrKey,
  arrName,
  persistName,
  required,
  forceNonRequired,
  description,
  isAdditionalProperties,
  removeField,
  persistedControls,
  customProps,
  urlParams,
  onRemoveByMinus,
}: {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  persistName?: TFormName
  required?: string[]
  forceNonRequired?: boolean
  description?: string
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  persistedControls: TPersistedControls
  customProps: TListInputCustomProps
  urlParams: TUrlParams
  onRemoveByMinus?: () => void
}) => {
  return (
    <FormListInput
      name={name}
      arrKey={arrKey}
      key={`${arrKey}-${JSON.stringify(name)}`}
      arrName={arrName}
      persistName={persistName}
      required={required}
      forceNonRequired={forceNonRequired}
      description={description}
      isAdditionalProperties={isAdditionalProperties}
      removeField={removeField}
      persistedControls={persistedControls}
      customProps={customProps}
      urlParams={urlParams}
      onRemoveByMinus={onRemoveByMinus}
    />
  )
}

export const getBooleanFormItemFromSwagger = ({
  name,
  arrKey,
  arrName,
  description,
  makeValueUndefined,
  isAdditionalProperties,
  removeField,
  onRemoveByMinus,
}: {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  description?: string
  makeValueUndefined?: (path: TFormName) => void
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  onRemoveByMinus?: () => void
}) => {
  return (
    <FormBooleanInput
      name={name}
      arrKey={arrKey}
      key={`${arrKey}-${JSON.stringify(name)}`}
      arrName={arrName}
      description={description}
      makeValueUndefined={makeValueUndefined}
      isAdditionalProperties={isAdditionalProperties}
      removeField={removeField}
      onRemoveByMinus={onRemoveByMinus}
    />
  )
}

export const getArrayFormItemFromSwagger = ({
  schema,
  name,
  arrKey,
  arrName,
  expandName,
  persistName,
  required,
  forceNonRequired,
  description,
  makeValueUndefined,
  addField,
  isAdditionalProperties,
  removeField,
  isEdit,
  expandedControls,
  persistedControls,
  sortPaths,
  urlParams,
  onRemoveByMinus,
}: {
  schema: OpenAPIV2.SchemaObject
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  expandName?: TFormName
  persistName?: TFormName
  required?: string[]
  forceNonRequired?: boolean
  description?: string
  makeValueUndefined?: (path: TFormName) => void
  addField: ({
    path,
    name,
    type,
    items,
    nestedProperties,
    required,
  }: {
    path: TFormName
    name: string
    type: string
    items?: { type: string }
    nestedProperties?: OpenAPIV2.SchemaObject['properties']
    required?: string
  }) => void
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  isEdit: boolean
  expandedControls: TExpandedControls
  persistedControls: TPersistedControls
  sortPaths?: string[][]
  urlParams: TUrlParams
  onRemoveByMinus?: () => void
}) => {
  // typescript as below are needed because of dereference procedure
  if (schema.type === 'array') {
    return (
      <HiddenContainer name={name} key={`${arrKey}-${JSON.stringify(name)}`}>
        <FormArrayHeader
          name={name}
          persistName={persistName}
          required={required}
          description={description}
          isAdditionalProperties={isAdditionalProperties}
          removeField={removeField}
          persistedControls={persistedControls}
          onRemoveByMinus={onRemoveByMinus}
        />
        <Styled.ResetedFormList
          key={arrKey !== undefined ? arrKey : Array.isArray(name) ? name.slice(-1)[0] : name}
          name={arrName || name}
          rules={
            !forceNonRequired && required?.includes(getStringByName(name))
              ? [
                  {
                    validator: async (_, value) => {
                      if (!value || value.length < 1) {
                        return Promise.reject(new Error('Field is required'))
                      }
                    },
                  },
                ]
              : undefined
          }
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(field => {
                const rawFieldType = (
                  schema.items as (OpenAPIV2.ItemsObject & { properties?: OpenAPIV2.SchemaObject }) | undefined
                )?.type
                // Handle type as string or string[] (OpenAPI v2 allows both)
                const fieldType = Array.isArray(rawFieldType) ? rawFieldType[0] : rawFieldType
                const description = (schema.items as (OpenAPIV2.ItemsObject & { description?: string }) | undefined)
                  ?.description
                const entry = schema.items as
                  | (OpenAPIV2.ItemsObject & { properties?: OpenAPIV2.SchemaObject; required?: string[] })
                  | undefined
                // additional properties are place near items
                const additionalProperties = schema.properties as
                  | Record<number, { properties?: OpenAPIV2.SchemaObject }>
                  | undefined
                return (
                  <ArrayInsideContainer key={field.key}>
                    {fieldType !== 'object' && (
                      <>
                        {fieldType === 'string' &&
                          getStringFormItemFromSwagger({
                            name: Array.isArray(name) ? [...name, field.name] : [name, field.name],
                            arrKey: field.key,
                            // arrName: [field.name, getStringByName(name)],
                            arrName: [field.name],
                            persistName: persistName
                              ? Array.isArray(persistName)
                                ? [...persistName, field.name]
                                : [persistName, field.name]
                              : Array.isArray(name)
                              ? [...name, field.name]
                              : [name, field.name],
                            description,
                            removeField,
                            persistedControls,
                            onRemoveByMinus: () => remove(field.name),
                          })}
                        {(fieldType === 'number' || fieldType === 'integer') &&
                          getNumberFormItemFromSwagger({
                            isNumber: fieldType === 'number',
                            name: Array.isArray(name) ? [...name, field.name] : [name, field.name],
                            arrKey: field.key,
                            // arrName: [field.name, getStringByName(name)],
                            arrName: [field.name],
                            persistName: persistName
                              ? Array.isArray(persistName)
                                ? [...persistName, field.name]
                                : [persistName, field.name]
                              : Array.isArray(name)
                              ? [...name, field.name]
                              : [name, field.name],
                            description,
                            removeField,
                            persistedControls,
                            onRemoveByMinus: () => remove(field.name),
                          })}
                        {(fieldType === 'rangeInputCpu' || fieldType === 'rangeInputMemory') &&
                          getRangeInputFormItemFromSwagger({
                            name: Array.isArray(name) ? [...name, field.name] : [name, field.name],
                            arrKey: field.key,
                            // arrName: [field.name, getStringByName(name)],
                            arrName: [field.name],
                            persistName: persistName
                              ? Array.isArray(persistName)
                                ? [...persistName, field.name]
                                : [persistName, field.name]
                              : Array.isArray(name)
                              ? [...name, field.name]
                              : [name, field.name],
                            description,
                            isEdit,
                            persistedControls,
                            customProps: (schema as unknown as { items: { customProps: TRangeInputCustomProps } }).items
                              .customProps,
                            urlParams,
                            onRemoveByMinus: () => remove(field.name),
                          })}
                        {fieldType === 'listInput' &&
                          getListInputFormItemFromSwagger({
                            name: Array.isArray(name) ? [...name, field.name] : [name, field.name],
                            arrKey: field.key,
                            // arrName: [field.name, getStringByName(name)],
                            arrName: [field.name],
                            persistName: persistName
                              ? Array.isArray(persistName)
                                ? [...persistName, field.name]
                                : [persistName, field.name]
                              : Array.isArray(name)
                              ? [...name, field.name]
                              : [name, field.name],
                            description,
                            removeField,
                            persistedControls,
                            customProps: (schema as unknown as { items: { customProps: TListInputCustomProps } }).items
                              .customProps,
                            urlParams,
                            onRemoveByMinus: () => remove(field.name),
                          })}
                        {fieldType === 'boolean' &&
                          getBooleanFormItemFromSwagger({
                            name: Array.isArray(name) ? [...name, field.name] : [name, field.name],
                            arrKey: field.key,
                            // arrName: [field.name, getStringByName(name)],
                            arrName: [field.name],
                            description,
                            makeValueUndefined,
                            removeField,
                            onRemoveByMinus: () => remove(field.name),
                          })}
                        {fieldType === 'array' &&
                          getArrayFormItemFromSwagger({
                            schema: schema.items as OpenAPIV2.SchemaObject,
                            name: Array.isArray(name) ? [...name, field.name] : [name, field.name],
                            arrKey: field.key,
                            arrName: [field.name],
                            expandName: expandName
                              ? Array.isArray(expandName)
                                ? [...expandName, field.name]
                                : [expandName, field.name]
                              : Array.isArray(name)
                              ? [...name, field.name]
                              : [name, field.name],
                            persistName: persistName
                              ? Array.isArray(persistName)
                                ? [...persistName, field.name]
                                : [persistName, field.name]
                              : Array.isArray(name)
                              ? [...name, field.name]
                              : [name, field.name],
                            description,
                            makeValueUndefined,
                            addField,
                            removeField,
                            isEdit,
                            expandedControls,
                            persistedControls,
                            sortPaths,
                            urlParams,
                            onRemoveByMinus: () => remove(field.name),
                          })}
                      </>
                    )}
                    {fieldType === 'object' &&
                      entry?.properties &&
                      getObjectFormItemFromSwagger({
                        // merging properties near items by this
                        properties: deepMerge(entry.properties, additionalProperties?.[field.key]?.properties || {}),
                        name: Array.isArray(name) ? [...name, field.name] : [name, field.name],
                        arrKey: field.key,
                        arrName: [field.name],
                        expandName: expandName
                          ? Array.isArray(expandName)
                            ? [...expandName, field.name]
                            : [expandName, field.name]
                          : Array.isArray(name)
                          ? [...name, field.name]
                          : [name, field.name],
                        persistName: persistName
                          ? Array.isArray(persistName)
                            ? [...persistName, field.name]
                            : [persistName, field.name]
                          : Array.isArray(name)
                          ? [...name, field.name]
                          : [name, field.name],
                        required: entry.required,
                        forceNonRequired,
                        description,
                        makeValueUndefined,
                        addField,
                        isAdditionalProperties,
                        removeField,
                        isEdit,
                        expandedControls,
                        persistedControls,
                        sortPaths,
                        urlParams,
                        onRemoveByMinus: () => remove(field.name),
                      })}
                  </ArrayInsideContainer>
                )
              })}
              <ResetedFormItem>
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    // Determine initial value based on item type
                    const fieldType = (
                      schema.items as (OpenAPIV2.ItemsObject & { properties?: OpenAPIV2.SchemaObject }) | undefined
                    )?.type
                    
                    let initialValue: unknown
                    // Handle type as string or string[] (OpenAPI v2 allows both)
                    const typeStr = Array.isArray(fieldType) ? fieldType[0] : fieldType
                    if (typeStr === 'string') {
                      initialValue = ''
                    } else if (typeStr === 'number' || typeStr === 'integer') {
                      initialValue = 0
                    } else if (typeStr === 'boolean') {
                      initialValue = false
                    } else if (typeStr === 'array') {
                      initialValue = []
                    } else if (typeStr === 'object') {
                      initialValue = {}
                    } else {
                      initialValue = ''
                    }
                    
                    add(initialValue)
                  }}
                >
                  <PlusIcon />
                </Button>
                <Form.ErrorList errors={errors} />
              </ResetedFormItem>
            </>
          )}
        </Styled.ResetedFormList>
      </HiddenContainer>
    )
  }
  return null
}

export const getObjectFormItemsDraft = ({
  properties,
  name,
  arrKey,
  arrName,
  expandName,
  persistName,
  required,
  forceNonRequired,
  description,
  namespaceData,
  makeValueUndefined,
  addField,
  removeField,
  isEdit,
  expandedControls,
  persistedControls,
  sortPaths,
  urlParams,
}: {
  properties: {
    [name: string]: OpenAPIV2.SchemaObject
  }
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  persistName?: TFormName
  expandName?: TFormName
  required?: (string | number)[]
  forceNonRequired?: boolean
  description?: string
  namespaceData?: TNamespaceData
  makeValueUndefined?: (path: TFormName) => void
  addField: ({
    path,
    name,
    type,
    items,
    nestedProperties,
    required,
  }: {
    path: TFormName
    name: string
    type: string
    items?: { type: string }
    nestedProperties?: OpenAPIV2.SchemaObject['properties']
    required?: string
  }) => void
  removeField: ({ path }: { path: TFormName }) => void
  isEdit: boolean
  expandedControls: TExpandedControls
  persistedControls: TPersistedControls
  sortPaths?: string[][]
  urlParams: TUrlParams
}) => {
  return (
    <HiddenContainer name={name} key={`${arrKey}-${JSON.stringify(name)}`}>
      {getSortedPropertyKeys({ name, sortPaths, properties }).map((el: keyof typeof properties) => {
        if (properties[el]['x-kubernetes-preserve-unknown-fields']) {
          // return <Alert key={String(el)} message="x-kubernetes-preserve-unknown-fields" banner />
          const path = Array.isArray(name) ? [...name, String(el)] : [name, String(el)]
          return (
            <FormObjectFromSwagger
              name={name}
              persistName={persistName}
              hiddenFormName={path}
              description={properties[el].description}
              removeField={removeField}
              expandedControls={expandedControls}
              persistedControls={persistedControls}
              collapseTitle={el}
              collapseFormName={path}
              data={
                <Form.Item noStyle shouldUpdate>
                  {f => (
                    <FormInlineYamlEditor
                      path={path}
                      persistedControls={persistedControls}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      externalValue={f.getFieldValue(path as any)}
                    />
                  )}
                </Form.Item>
              }
              key={Array.isArray(name) ? [...name, String(el)].join('-') : [name, String(el)].join('-')}
            />
          )
        }
        if (properties[el].type === 'string' && properties[el].enum) {
          return getEnumStringFormItemFromSwagger({
            name: Array.isArray(name) ? [...name, String(el)] : [name, String(el)],
            arrKey,
            arrName: Array.isArray(arrName) ? [...arrName, String(el)] : undefined,
            persistName: persistName
              ? Array.isArray(persistName)
                ? [...persistName, String(el)]
                : [persistName, String(el)]
              : undefined,
            // required: required?.includes(getStringByName(objName)) ? [String(el)] : undefined,
            required: required?.includes(el) ? [String(el)] : undefined,
            forceNonRequired,
            description: properties[el].description,
            isAdditionalProperties: properties[el].isAdditionalProperties,
            removeField,
            persistedControls,
            options: properties[el].enum || [],
          })
        }
        if (
          (properties[el].type === 'string' && !properties[el].enum) ||
          Object.keys(properties[el]).includes('x-kubernetes-int-or-string')
        ) {
          return getStringFormItemFromSwagger({
            name: Array.isArray(name) ? [...name, String(el)] : [name, String(el)],
            arrKey,
            arrName: Array.isArray(arrName) ? [...arrName, String(el)] : undefined,
            persistName: persistName
              ? Array.isArray(persistName)
                ? [...persistName, String(el)]
                : [persistName, String(el)]
              : undefined,
            // required: required?.includes(getStringByName(objName)) ? [String(el)] : undefined,
            required: required?.includes(el) ? [String(el)] : undefined,
            forceNonRequired,
            description: properties[el].description,
            namespaceData,
            isAdditionalProperties: properties[el].isAdditionalProperties,
            removeField,
            persistedControls,
          })
        }
        if (properties[el].type === 'number' || properties[el].type === 'integer') {
          return getNumberFormItemFromSwagger({
            isNumber: properties[el].type === 'number',
            name: Array.isArray(name) ? [...name, String(el)] : [name, String(el)],
            arrKey,
            arrName: Array.isArray(arrName) ? [...arrName, String(el)] : undefined,
            persistName: persistName
              ? Array.isArray(persistName)
                ? [...persistName, String(el)]
                : [persistName, String(el)]
              : undefined,
            // required: required?.includes(getStringByName(objName)) ? [String(el)] : undefined,
            required: required?.includes(el) ? [String(el)] : undefined,
            forceNonRequired,
            description: properties[el].description,
            isAdditionalProperties: properties[el].isAdditionalProperties,
            removeField,
            persistedControls,
          })
        }
        if (properties[el].type === 'rangeInputCpu' || properties[el].type === 'rangeInputMemory') {
          return getRangeInputFormItemFromSwagger({
            name: Array.isArray(name) ? [...name, String(el)] : [name, String(el)],
            arrKey,
            arrName: Array.isArray(arrName) ? [...arrName, String(el)] : undefined,
            persistName: persistName
              ? Array.isArray(persistName)
                ? [...persistName, String(el)]
                : [persistName, String(el)]
              : undefined,
            // required: required?.includes(getStringByName(objName)) ? [String(el)] : undefined,
            required: required?.includes(el) ? [String(el)] : undefined,
            forceNonRequired,
            description: properties[el].description,
            isEdit,
            customProps: properties[el].customProps,
            persistedControls,
            urlParams,
          })
        }
        if (properties[el].type === 'listInput') {
          return getListInputFormItemFromSwagger({
            name: Array.isArray(name) ? [...name, String(el)] : [name, String(el)],
            arrKey,
            arrName: Array.isArray(arrName) ? [...arrName, String(el)] : undefined,
            persistName: persistName
              ? Array.isArray(persistName)
                ? [...persistName, String(el)]
                : [persistName, String(el)]
              : undefined,
            // required: required?.includes(getStringByName(objName)) ? [String(el)] : undefined,
            required: required?.includes(el) ? [String(el)] : undefined,
            forceNonRequired,
            description: properties[el].description,
            customProps: properties[el].customProps,
            removeField,
            persistedControls,
            urlParams,
          })
        }
        if (properties[el].type === 'boolean') {
          return getBooleanFormItemFromSwagger({
            name: Array.isArray(name) ? [...name, String(el)] : [name, String(el)],
            arrKey,
            arrName: Array.isArray(arrName) ? [...arrName, String(el)] : undefined,
            description: properties[el].description,
            makeValueUndefined,
            isAdditionalProperties: properties[el].isAdditionalProperties,
            removeField,
          })
        }
        if (properties[el].type === 'array') {
          return getArrayFormItemFromSwagger({
            schema: properties[el],
            name: Array.isArray(name) ? [...name, String(el)] : [name, String(el)],
            arrKey,
            arrName: Array.isArray(arrName) ? [...arrName, String(el)] : undefined,
            expandName: expandName
              ? Array.isArray(expandName)
                ? [...expandName, String(el)]
                : [expandName, String(el)]
              : undefined,
            persistName: persistName
              ? Array.isArray(persistName)
                ? [...persistName, String(el)]
                : [persistName, String(el)]
              : undefined,
            // required: required?.includes(getStringByName(objName)) ? [String(el)] : undefined,
            required: required?.includes(el) ? [String(el)] : undefined,
            forceNonRequired,
            description: properties[el].description,
            makeValueUndefined,
            addField,
            isAdditionalProperties: properties[el].isAdditionalProperties,
            removeField,
            isEdit,
            expandedControls,
            persistedControls,
            sortPaths,
            urlParams,
          })
        }
        if (properties[el].additionalProperties) {
          const data = properties[el].properties
            ? getObjectFormItemsDraft({
                properties: properties[el].properties as {
                  [name: string]: OpenAPIV2.SchemaObject
                },
                name: Array.isArray(name) ? [...name, String(el)] : [name, String(el)],
                arrKey,
                arrName: Array.isArray(arrName) ? [...arrName, String(el)] : undefined,
                expandName: expandName
                  ? Array.isArray(expandName)
                    ? [...expandName, String(el)]
                    : [expandName, String(el)]
                  : undefined,
                persistName: persistName
                  ? Array.isArray(persistName)
                    ? [...persistName, String(el)]
                    : [persistName, String(el)]
                  : undefined,
                required: properties[el].required,
                forceNonRequired,
                description: properties[el].description,
                namespaceData,
                makeValueUndefined,
                addField,
                removeField,
                isEdit,
                expandedControls,
                persistedControls,
                sortPaths,
                urlParams,
              })
            : undefined
          return (
            <FormObjectFromSwagger
              name={name}
              persistName={persistName}
              hiddenFormName={Array.isArray(name) ? [...name, String(el)] : [name, String(el)]}
              description={description}
              removeField={removeField}
              expandedControls={expandedControls}
              persistedControls={persistedControls}
              collapseTitle={el}
              collapseFormName={Array.isArray(name) ? [...name, String(el)] : [name, String(el)]}
              data={data}
              inputProps={{
                addField,
                additionalProperties: properties[el]?.additionalProperties,
              }}
              key={Array.isArray(name) ? [...name, String(el)].join('-') : [name, String(el)].join('-')}
            />
          )
        }
        if (properties[el].type === 'object' && properties[el].properties) {
          return getObjectFormItemFromSwagger({
            properties: properties[el].properties as {
              [name: string]: OpenAPIV2.SchemaObject
            },
            name: Array.isArray(name) ? [...name, String(el)] : [name, String(el)],
            arrKey,
            arrName: Array.isArray(arrName) ? [...arrName, String(el)] : undefined,
            expandName: expandName
              ? Array.isArray(expandName)
                ? [...expandName, String(el)]
                : [expandName, String(el)]
              : undefined,
            persistName: persistName
              ? Array.isArray(persistName)
                ? [...persistName, String(el)]
                : [persistName, String(el)]
              : undefined,
            selfRequired: required?.includes(el),
            required: properties[el].required,
            forceNonRequired: forceNonRequired || !required?.includes(el),
            description: properties[el].description,
            namespaceData,
            makeValueUndefined,
            addField,
            isAdditionalProperties: properties[el].isAdditionalProperties,
            removeField,
            isEdit,
            expandedControls,
            persistedControls,
            sortPaths,
            urlParams,
          })
        }
        return null
      })}
    </HiddenContainer>
  )
}

export const getObjectFormItemFromSwagger = ({
  properties,
  name,
  arrKey,
  arrName,
  expandName,
  persistName,
  selfRequired,
  required,
  forceNonRequired,
  description,
  namespaceData,
  makeValueUndefined,
  addField,
  isAdditionalProperties,
  removeField,
  isEdit,
  expandedControls,
  persistedControls,
  sortPaths,
  urlParams,
  onRemoveByMinus,
}: {
  properties: {
    [name: string]: OpenAPIV2.SchemaObject
  }
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  expandName?: TFormName
  persistName?: TFormName
  selfRequired?: boolean
  required?: (string | number)[]
  forceNonRequired?: boolean
  description?: string
  namespaceData?: TNamespaceData
  makeValueUndefined?: (path: TFormName) => void
  addField: ({
    path,
    name,
    type,
    items,
    nestedProperties,
    required,
  }: {
    path: TFormName
    name: string
    type: string
    items?: { type: string }
    nestedProperties?: OpenAPIV2.SchemaObject['properties']
    required?: string
  }) => void
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  isEdit: boolean
  expandedControls: TExpandedControls
  persistedControls: TPersistedControls
  sortPaths?: string[][]
  urlParams: TUrlParams
  onRemoveByMinus?: () => void
}) => {
  const data = getObjectFormItemsDraft({
    properties,
    name,
    arrKey,
    arrName,
    expandName,
    persistName,
    required,
    forceNonRequired,
    description,
    namespaceData,
    makeValueUndefined,
    addField,
    removeField,
    isEdit,
    expandedControls,
    persistedControls,
    sortPaths,
    urlParams,
  })
  return (
    <FormObjectFromSwagger
      name={name}
      key={`${arrKey}-${JSON.stringify(name)}`}
      persistName={persistName}
      selfRequired={selfRequired}
      description={description}
      isAdditionalProperties={isAdditionalProperties}
      removeField={removeField}
      expandedControls={expandedControls}
      persistedControls={persistedControls}
      collapseTitle={name}
      collapseFormName={expandName || name}
      data={data}
      onRemoveByMinus={onRemoveByMinus}
    />
  )
}
