/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Form, Button, Alert } from 'antd'
import Editor from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import * as yaml from 'yaml'
import { OpenAPIV2 } from 'openapi-types'
import { getStringByName } from 'utils/getStringByName'
import { TListInputCustomProps, TRangeInputCustomProps } from 'localTypes/formExtensions'
import { TFormName, TExpandedControls, TNamespaceData, TPersistedControls, TUrlParams } from 'localTypes/form'
import { PlusIcon } from 'components/atoms'
import { deepMerge } from 'utils/deepMerge'
import { ResetedFormItem, ArrayInsideContainer, HiddenContainer } from '../../atoms'
import { useOnValuesChangeCallback } from './context'
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
                const fieldType = (
                  schema.items as (OpenAPIV2.ItemsObject & { properties?: OpenAPIV2.SchemaObject }) | undefined
                )?.type
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
                        urlParams,
                        onRemoveByMinus: () => remove(field.name),
                      })}
                  </ArrayInsideContainer>
                )
              })}
              <ResetedFormItem>
                <Button type="text" size="small" onClick={() => add()}>
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
  urlParams: TUrlParams
}) => {
  return (
    <HiddenContainer name={name} key={`${arrKey}-${JSON.stringify(name)}`}>
      {Object.keys(properties).map((el: keyof typeof properties) => {
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
            urlParams,
          })
        }
        if (properties[el].type === 'object' && properties[el]['x-kubernetes-preserve-unknown-fields']) {
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
                  {(f) => (
                    <InlineYamlEditor
                      path={path}
                      persistedControls={persistedControls}
                      externalValue={f.getFieldValue(path as any)}
                    />
                  )}
                </Form.Item>
              }
              key={Array.isArray(name) ? [...name, String(el)].join('-') : [name, String(el)].join('-')}
            />
          )
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

/* Inline YAML editor for unknown fields (x-kubernetes-preserve-unknown-fields) */
const InlineYamlEditor: React.FC<{ path: TFormName; persistedControls: TPersistedControls; externalValue?: unknown }>
  = ({ path, persistedControls, externalValue }) => {
  const form = Form.useFormInstance()
  const onValuesChange = useOnValuesChangeCallback()

  const [yamlText, setYamlText] = useState<string>('')
  const monacoRef = useRef<typeof monaco | null>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const isLocalEditRef = useRef<boolean>(false)
  const clearLocalEditTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFocusedRef = useRef<boolean>(false)

  // focus is tracked via Monaco events for reliability during IME/composition

  const modelUri = useMemo(() => {
    const encoded = encodeURIComponent(JSON.stringify(path))
    return `inmemory://openapi-ui/unknown/${encoded}.yaml`
  }, [path])

  // Watch specific field for external updates (e.g., main YAML editor)
  const watchedValue = Form.useWatch(path as any, form)
  useEffect(() => {
    if (isLocalEditRef.current) return
    if (isFocusedRef.current) return
    const value = watchedValue
    const isEmptyObj = value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0
    const next = (value == null || isEmptyObj) ? '' : yaml.stringify(value) ?? ''
    setYamlText(prev => (prev === next ? prev : next))
  }, [watchedValue])

  // Force-sync from externalValue prop (provided by parent Form.Item with shouldUpdate)
  useEffect(() => {
    if (isLocalEditRef.current) return
    if (isFocusedRef.current) return
    const value = externalValue
    const isEmptyObj = value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0
    const next = (value == null || isEmptyObj) ? '' : yaml.stringify(value) ?? ''
    setYamlText(prev => (prev === next ? prev : next))
  }, [externalValue])

  // Keep model tokenization and content in sync when not locally editing or focused
  useEffect(() => {
    if (isLocalEditRef.current) return
    if (isFocusedRef.current) return
    const ed = editorRef.current
    const m = monacoRef.current
    if (!ed || !m) return
    const uri = m.Uri.parse(modelUri)
    let model = ed.getModel() || m.editor.getModel(uri)
    if (!model) {
      model = m.editor.createModel(yamlText ?? '', 'yaml', uri)
    }
    if (model) {
      m.editor.setModelLanguage(model, 'yaml')
      const current = model.getValue()
      if ((yamlText ?? '') !== current) {
        model.setValue(yamlText ?? '')
      }
    }
  }, [yamlText, modelUri])

  return (
    <div style={{ height: 140 }}>
      <Editor
        language="yaml"
        path={modelUri}
        keepCurrentModel
        width="100%"
        height="100%"
        defaultValue={yamlText ?? ''}
        onMount={(editor, m) => {
          editorRef.current = editor
          monacoRef.current = m
          // initialize focus state
          try {
            isFocusedRef.current = !!editor.hasTextFocus?.()
          } catch {
            isFocusedRef.current = false
          }
          editor.onDidFocusEditorText(() => {
            isFocusedRef.current = true
          })
          editor.onDidBlurEditorText(() => {
            isFocusedRef.current = false
          })
          const uri = m.Uri.parse(modelUri)
          let model = editor.getModel() || m.editor.getModel(uri)
          if (!model) {
            model = m.editor.createModel(yamlText ?? '', 'yaml', uri)
          }
          if (model) {
            const ensureYaml = () => {
              try {
                const mm = monacoRef.current
                const ee = editorRef.current
                if (!mm || !ee) return
                const u = mm.Uri.parse(modelUri)
                const mdl = ee.getModel() || mm.editor.getModel(u)
                if (!mdl) return
                const lang = (mdl as any).getLanguageId?.() || (mdl as any).getModeId?.()
                if (lang !== 'yaml') {
                  mm.editor.setModelLanguage(mdl, 'yaml')
                }
              } catch {}
            }
            // Initial apply and a few retries to cover lazy language loading/layout timing
            ensureYaml()
            try { requestAnimationFrame(() => ensureYaml()) } catch {}
            setTimeout(() => ensureYaml(), 50)
            setTimeout(() => ensureYaml(), 200)
          }
        }}
        onValidate={() => {
          // Re-apply model language to restore tokenization after value changes from outside
          const m = monacoRef.current
          const ed = editorRef.current
          if (!m || !ed) return
          const uri = m.Uri.parse(modelUri)
          const model = ed.getModel() || m.editor.getModel(uri)
          if (model) {
            m.editor.setModelLanguage(model, 'yaml')
          }
        }}
        onChange={value => {
          const nextText = value || ''
          // Debounce local flag longer to avoid flicker with fast inputs and async BFF roundtrip
          isLocalEditRef.current = true
          if (clearLocalEditTimeoutRef.current) clearTimeout(clearLocalEditTimeoutRef.current)
          setYamlText(nextText)
          try {
            const parsed = yaml.parse(nextText || '')
            // Normalize empty content/null/empty object to an empty object value
            let nextValue: any
            if (!nextText.trim()) {
              nextValue = {}
            } else if (parsed === null) {
              nextValue = {}
            } else if (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 0) {
              nextValue = {}
            } else {
              nextValue = parsed
            }
            form.setFieldValue(path as any, nextValue)
            // Mark persisted to prevent cleanup from removing empty object branch
            if (!persistedControls.persistedKeys.some(k => JSON.stringify(k) === JSON.stringify(path))) {
              persistedControls.onPersistMark(path, 'obj')
            }
            onValuesChange?.()
          } catch {
            // ignore parse errors while typing
          }
          clearLocalEditTimeoutRef.current = setTimeout(() => {
            isLocalEditRef.current = false
          }, 600)
        }}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          renderLineHighlight: 'none',
          scrollbar: { vertical: 'hidden', horizontal: 'auto' },
          overviewRulerLanes: 0,
          wordWrap: 'on',
        }}
      />
    </div>
  )
}
