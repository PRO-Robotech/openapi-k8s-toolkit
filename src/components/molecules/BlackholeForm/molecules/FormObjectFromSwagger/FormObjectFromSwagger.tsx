import React, { FC, useState } from 'react'
import { OpenAPIV2, IJsonSchema } from 'openapi-types'
import { Typography, Tooltip, Input, Button } from 'antd'
import { getStringByName } from 'utils/getStringByName'
import { TFormName, TExpandedControls, TPersistedControls } from 'localTypes/form'
import { PlusIcon } from 'components/atoms'
import { CustomCollapse, PersistedCheckbox, CustomSizeTitle, HiddenContainer } from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'

type TFormObjectFromSwaggerProps = {
  name: TFormName
  persistName?: TFormName
  selfRequired?: boolean
  hiddenFormName?: TFormName
  description?: string
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  expandedControls: TExpandedControls
  persistedControls: TPersistedControls
  collapseTitle: TFormName
  collapseFormName: TFormName
  data?: JSX.Element
  inputProps?: {
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
    additionalProperties: boolean | IJsonSchema | undefined
  }
  onRemoveByMinus?: () => void
}

export const FormObjectFromSwagger: FC<TFormObjectFromSwaggerProps> = ({
  name,
  persistName,
  selfRequired,
  hiddenFormName,
  description,
  isAdditionalProperties,
  removeField,
  expandedControls,
  persistedControls,
  collapseTitle,
  collapseFormName,
  data,
  inputProps,
  onRemoveByMinus,
}) => {
  const designNewLayout = useDesignNewLayout()
  const [additionalPropValue, setAddditionalPropValue] = useState<string>()

  const additionalPropCreate = () => {
    if (additionalPropValue && additionalPropValue.length > 0) {
      const addProps = inputProps?.additionalProperties as {
        type: string
        items?: { type: string }
        properties?: OpenAPIV2.SchemaObject['properties']
        required?: string
      }
      
      // Check if the field name exists in additionalProperties.properties
      // If so, use the type from that property definition
      const nestedProp = addProps?.properties?.[additionalPropValue] as OpenAPIV2.SchemaObject | undefined
      let fieldType: string = addProps.type
      let fieldItems: { type: string } | undefined = addProps.items
      let fieldNestedProperties = addProps.properties || {}
      let fieldRequired: string | undefined = addProps.required
      
      if (nestedProp) {
        // Use the nested property definition if it exists
        // Handle type - it can be string or string[] in OpenAPI v2
        if (nestedProp.type) {
          if (Array.isArray(nestedProp.type)) {
            fieldType = nestedProp.type[0] || addProps.type
          } else if (typeof nestedProp.type === 'string') {
            fieldType = nestedProp.type
          } else {
            fieldType = addProps.type
          }
        } else {
          fieldType = addProps.type
        }
        
        // Handle items - it can be ItemsObject or ReferenceObject
        if (nestedProp.items) {
          // Check if it's a valid ItemsObject with type property
          if ('type' in nestedProp.items && typeof nestedProp.items.type === 'string') {
            fieldItems = { type: nestedProp.items.type }
          } else {
            fieldItems = addProps.items
          }
        } else {
          fieldItems = addProps.items
        }
        
        fieldNestedProperties = nestedProp.properties || {}
        // Handle required field - it can be string[] in OpenAPI schema
        if (Array.isArray(nestedProp.required)) {
          fieldRequired = nestedProp.required.join(',')
        } else if (typeof nestedProp.required === 'string') {
          fieldRequired = nestedProp.required
        } else {
          fieldRequired = addProps.required
        }
      }
      
      inputProps?.addField({
        path: Array.isArray(name) ? [...name, String(collapseTitle)] : [name, String(collapseTitle)],
        name: additionalPropValue,
        type: fieldType,
        items: fieldItems,
        nestedProperties: fieldNestedProperties,
        required: fieldRequired,
      })
      setAddditionalPropValue(undefined)
    }
  }

  const title = (
    <>
      {getStringByName(collapseTitle)}
      {selfRequired && <Typography.Text type="danger">*</Typography.Text>}
    </>
  )

  return (
    <HiddenContainer name={name} secondName={hiddenFormName}>
      <CustomCollapse
        title={
          <CustomSizeTitle $designNewLayout={designNewLayout}>
            {description ? <Tooltip title={description}>{title}</Tooltip> : title}
          </CustomSizeTitle>
        }
        formName={collapseFormName}
        expandedControls={expandedControls}
        isAdditionalProperties={isAdditionalProperties}
        removeField={() => removeField({ path: name })}
        onRemoveByMinus={onRemoveByMinus}
        persistedCheckbox={
          inputProps ? undefined : (
            <PersistedCheckbox formName={persistName || name} persistedControls={persistedControls} type="obj" />
          )
        }
        key={Array.isArray(name) ? name.join('-') : name}
      >
        {data}
        {inputProps && (
          <Input
            placeholder="Enter field name"
            allowClear
            value={additionalPropValue}
            onChange={e => setAddditionalPropValue(e.target.value)}
            suffix={
              <Button size="small" type="text" onClick={additionalPropCreate}>
                <PlusIcon />
              </Button>
            }
          />
        )}
      </CustomCollapse>
    </HiddenContainer>
  )
}
