import React, { FC, useState } from 'react'
import { OpenAPIV2, IJsonSchema } from 'openapi-types'
import { Typography, Tooltip, Input, Button, Form } from 'antd'
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
  const form = Form.useFormInstance()
  const [additionalPropValue, setAddditionalPropValue] = useState<string>()

  const focusFieldInput = (path: TFormName) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const tryFocus = (attempt = 0) => {
      const fieldInstance = form.getFieldInstance(path) as { focus?: () => void } | undefined

      if (fieldInstance && typeof fieldInstance.focus === 'function') {
        fieldInstance.focus()
        return
      }

      const tokens = Array.isArray(path) ? path.map(String) : [String(path)]
      const fieldId = tokens.join('_')
      const byId = document.getElementById(fieldId) as HTMLElement | null

      if (byId && typeof (byId as { focus?: () => void }).focus === 'function') {
        const focusableById = byId as { focus: () => void }
        focusableById.focus()
        return
      }

      const byIdSuffix = document.querySelector(`[id$="${fieldId}"]`) as HTMLElement | null
      if (byIdSuffix && typeof (byIdSuffix as { focus?: () => void }).focus === 'function') {
        const focusableBySuffix = byIdSuffix as { focus: () => void }
        focusableBySuffix.focus()
        return
      }

      if (attempt < 5) {
        window.requestAnimationFrame(() => tryFocus(attempt + 1))
      }
    }

    window.requestAnimationFrame(() => tryFocus())
  }

  const additionalPropCreate = () => {
    if (additionalPropValue && additionalPropValue.length > 0) {
      const addProps = inputProps?.additionalProperties as {
        type: string
        items?: { type: string }
        properties?: OpenAPIV2.SchemaObject['properties']
        required?: string
      }
      const path = Array.isArray(name) ? [...name, String(collapseTitle)] : [name, String(collapseTitle)]
      const newFieldPath = [...path, additionalPropValue]
      inputProps?.addField({
        path,
        name: additionalPropValue,
        type: addProps.type,
        items: addProps.items,
        nestedProperties: addProps.properties || {},
        required: addProps.required,
      })
      setAddditionalPropValue(undefined)
      focusFieldInput(newFieldPath)
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
