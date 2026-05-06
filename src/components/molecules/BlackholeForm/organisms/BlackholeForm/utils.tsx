/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
// import { Form, Button, Alert } from 'antd'
import { Form, Button } from 'antd'
import type { ValidatorRule } from 'rc-field-form/lib/interface'
import { getStringByName } from 'utils/getStringByName'
import { TListInputCustomProps, TRangeInputCustomProps } from 'localTypes/formExtensions'
import { TFormName, TExpandedControls, TNamespaceData, TPersistedControls, TUrlParams } from 'localTypes/form'
import { TFormSchemaNode, TFormSchemaProperties } from 'localTypes/formSchema'
import { PlusIcon } from 'components/atoms'
import { deepMerge } from 'utils/deepMerge'
import { getSortedPropertyKeys } from './helpers/getSortedPropertyKeys'
import { pathKey } from './helpers/casts'
import {
  extractStringDefault,
  extractNumberDefault,
  extractBooleanDefault,
  extractListInputDefault,
} from './helpers/extractDefaultValue'
import { ResetedFormItem, ArrayInsideContainer, HiddenContainer } from '../../atoms'
import { getArrayItemsRule, prettyFieldPath } from '../../molecules/helpers/validation'
import {
  FormNamespaceInput,
  FormStringInput,
  FormEnumStringInput,
  FormNumberInput,
  FormRangeInput,
  FormListInput,
  FormStringMultilineInput,
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
  defaultValue,
  example,
  nullable,
  format,
  pattern,
  minLength,
  maxLength,
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
  defaultValue?: string
  example?: string
  nullable?: boolean
  format?: string
  pattern?: string
  minLength?: number
  maxLength?: number
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
      defaultValue={defaultValue}
      example={example}
      nullable={nullable}
      format={format}
      pattern={pattern}
      minLength={minLength}
      maxLength={maxLength}
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
  defaultValue,
  example,
  nullable,
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
  defaultValue?: string
  example?: string
  nullable?: boolean
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
      defaultValue={defaultValue}
      example={example}
      nullable={nullable}
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
  defaultValue,
  example,
  nullable,
  format,
  minimum,
  maximum,
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
  defaultValue?: number
  example?: number
  nullable?: boolean
  format?: string
  minimum?: number
  maximum?: number
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
      defaultValue={defaultValue}
      example={example}
      nullable={nullable}
      format={format}
      minimum={minimum}
      maximum={maximum}
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

export const getStringMultilineFormItemFromSwagger = ({
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
  isBase64,
  defaultValue,
  example,
  nullable,
  format,
  pattern,
  minLength,
  maxLength,
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
  onRemoveByMinus?: () => void
  isBase64?: boolean
  defaultValue?: string
  example?: string
  nullable?: boolean
  format?: string
  pattern?: string
  minLength?: number
  maxLength?: number
}) => {
  return (
    <FormStringMultilineInput
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
      isBase64={isBase64}
      defaultValue={defaultValue}
      example={example}
      nullable={nullable}
      format={format}
      pattern={pattern}
      minLength={minLength}
      maxLength={maxLength}
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
  defaultValue,
  minItems,
  maxItems,
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
  defaultValue?: string | string[]
  minItems?: number
  maxItems?: number
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
      defaultValue={defaultValue}
      minItems={minItems}
      maxItems={maxItems}
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
  defaultValue,
}: {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  description?: string
  makeValueUndefined?: (path: TFormName) => void
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  onRemoveByMinus?: () => void
  defaultValue?: boolean
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
      defaultValue={defaultValue}
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
  objectValidationErrors,
  sortPaths,
  urlParams,
  onRemoveByMinus,
}: {
  schema: TFormSchemaNode
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
    items?: TFormSchemaNode
    nestedProperties?: TFormSchemaProperties
    required?: string
  }) => void
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  isEdit: boolean
  expandedControls: TExpandedControls
  persistedControls: TPersistedControls
  objectValidationErrors?: Record<string, string[]>
  sortPaths?: string[][]
  urlParams: TUrlParams
  onRemoveByMinus?: () => void
}) => {
  // typescript as below are needed because of dereference procedure
  if (schema.type === 'array') {
    const requiredArrayRule: ValidatorRule | undefined =
      !forceNonRequired && required?.includes(getStringByName(name))
        ? {
            validator: async (_: unknown, value: unknown) => {
              if (!Array.isArray(value) || value.length < 1) {
                return Promise.reject(new Error(`Please enter ${prettyFieldPath(name)}`))
              }
            },
          }
        : undefined
    const arrayItemsRule = getArrayItemsRule({
      minItems: schema.minItems,
      maxItems: schema.maxItems,
      name,
    }) as ValidatorRule | undefined
    const arrayRules: ValidatorRule[] = []

    if (requiredArrayRule) arrayRules.push(requiredArrayRule)
    if (arrayItemsRule) arrayRules.push(arrayItemsRule)

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
          rules={arrayRules.length > 0 ? arrayRules : undefined}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(field => {
                const itemSchema = schema.items
                const fieldType = itemSchema?.type
                const description = itemSchema?.description
                const entry = itemSchema
                // additional properties are place near items
                const additionalProperties = schema.properties as
                  | Record<number, { properties?: TFormSchemaProperties }>
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
                            format: itemSchema?.format,
                            pattern: itemSchema?.pattern,
                            minLength: itemSchema?.minLength,
                            maxLength: itemSchema?.maxLength,
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
                            format: itemSchema?.format,
                            minimum: itemSchema?.minimum,
                            maximum: itemSchema?.maximum,
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
                            minItems: itemSchema?.minItems,
                            maxItems: itemSchema?.maxItems,
                          })}
                        {(fieldType === 'multilineString' || fieldType === 'multilineStringBase64') &&
                          getStringMultilineFormItemFromSwagger({
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
                            isBase64: fieldType === 'multilineStringBase64',
                            format: itemSchema?.format,
                            pattern: itemSchema?.pattern,
                            minLength: itemSchema?.minLength,
                            maxLength: itemSchema?.maxLength,
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
                            schema: schema.items as TFormSchemaNode,
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
                        oneOfRequiredGroups: entry.oneOfRequiredGroups,
                        oneOfBranches: entry.oneOfBranches,
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
                        objectValidationErrors,
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
                  disabled={schema.maxItems !== undefined && fields.length >= schema.maxItems}
                  onClick={() => {
                    add()
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
  objectValidationErrors,
  sortPaths,
  urlParams,
}: {
  properties: TFormSchemaProperties
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
    items?: TFormSchemaNode
    nestedProperties?: TFormSchemaProperties
    required?: string
  }) => void
  removeField: ({ path }: { path: TFormName }) => void
  isEdit: boolean
  expandedControls: TExpandedControls
  persistedControls: TPersistedControls
  objectValidationErrors?: Record<string, string[]>
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
            defaultValue: extractStringDefault(properties[el].default),
            example: extractStringDefault(properties[el].example),
            nullable: properties[el].nullable,
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
            defaultValue: extractStringDefault(properties[el].default),
            example: extractStringDefault(properties[el].example),
            nullable: properties[el].nullable,
            format: properties[el].format,
            pattern: properties[el].pattern,
            minLength: properties[el].minLength,
            maxLength: properties[el].maxLength,
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
            defaultValue: extractNumberDefault(properties[el].default),
            example: extractNumberDefault(properties[el].example),
            nullable: properties[el].nullable,
            format: properties[el].format,
            minimum: properties[el].minimum,
            maximum: properties[el].maximum,
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
            customProps: properties[el].customProps as TRangeInputCustomProps,
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
            customProps: properties[el].customProps as TListInputCustomProps,
            removeField,
            persistedControls,
            urlParams,
            defaultValue: extractListInputDefault(properties[el].default),
            minItems: properties[el].minItems,
            maxItems: properties[el].maxItems,
          })
        }
        if (properties[el].type === 'multilineString' || properties[el].type === 'multilineStringBase64') {
          return getStringMultilineFormItemFromSwagger({
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
            isBase64: properties[el].type === 'multilineStringBase64',
            defaultValue: extractStringDefault(properties[el].default),
            example: extractStringDefault(properties[el].example),
            nullable: properties[el].nullable,
            format: properties[el].format,
            pattern: properties[el].pattern,
            minLength: properties[el].minLength,
            maxLength: properties[el].maxLength,
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
            defaultValue: extractBooleanDefault(properties[el].default),
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
                properties: properties[el].properties as TFormSchemaProperties,
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
                objectValidationErrors,
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
            properties: properties[el].properties as TFormSchemaProperties,
            oneOfRequiredGroups: properties[el].oneOfRequiredGroups,
            oneOfBranches: properties[el].oneOfBranches,
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
            objectValidationErrors,
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
  oneOfRequiredGroups,
  oneOfBranches,
  objectValidationErrors,
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
  properties: TFormSchemaProperties
  oneOfRequiredGroups?: string[][]
  oneOfBranches?: TFormSchemaNode['oneOfBranches']
  objectValidationErrors?: Record<string, string[]>
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
    items?: TFormSchemaNode
    nestedProperties?: TFormSchemaProperties
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
    objectValidationErrors,
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
      oneOfRequiredGroups={oneOfRequiredGroups}
      oneOfBranches={oneOfBranches}
      validationErrors={objectValidationErrors?.[pathKey(Array.isArray(name) ? name : [name])]}
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
