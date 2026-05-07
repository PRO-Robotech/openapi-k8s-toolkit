import React, { FC, useEffect, useRef } from 'react'
import { Flex, Typography, Select, Button, Form } from 'antd'
import { TFormName, TNamespaceData } from 'localTypes/form'
import { MinusIcon, feedbackIcons } from 'components/atoms'
import { CustomSizeTitle, HiddenContainer, ResetedFormItem, DefaultValueButton } from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'
import { getRequiredRule, prettyFieldPath } from '../helpers/validation'
import { useDefaultValueButton } from '../helpers/useDefaultValueButton'

type TFormNamespaceInputProps = {
  name: TFormName
  namespaceData: TNamespaceData
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  /**
   * YAML / OpenAPI default for the namespace field. Drives placeholder hint and the
   * Apply Default / Clear button, and has priority over contextNamespace in the
   * one-shot mount cascade because it's an explicit declarative choice from the
   * schema author.
   */
  defaultValue?: string
  /**
   * Current namespace from the URL route context. Used as a fallback when defaultValue
   * is absent or refers to a namespace that doesn't exist in the cluster.
   */
  contextNamespace?: string
}

const isNamespaceAvailable = (candidate: string, namespaceData: NonNullable<TNamespaceData>): boolean =>
  namespaceData.selectValues.some(option => option.value === candidate)

export const FormNamespaceInput: FC<TFormNamespaceInputProps> = ({
  name,
  namespaceData,
  isAdditionalProperties,
  removeField,
  defaultValue,
  contextNamespace,
}) => {
  const designNewLayout = useDesignNewLayout()
  const form = Form.useFormInstance()
  const defaultBtn = useDefaultValueButton(name, defaultValue)
  const cascadeAppliedRef = useRef(false)

  useEffect(() => {
    if (cascadeAppliedRef.current) return
    if (!namespaceData) return

    const currentValue = form.getFieldValue(name)
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      cascadeAppliedRef.current = true
      return
    }

    const defaultIsValid = defaultValue !== undefined && isNamespaceAvailable(defaultValue, namespaceData)

    if (defaultValue !== undefined && !defaultIsValid) {
      // eslint-disable-next-line no-console
      console.warn(
        `[FormNamespaceInput] Default namespace "${defaultValue}" is not available in this cluster for ${prettyFieldPath(
          name,
        )}, falling back to URL context`,
      )
    }

    if (defaultIsValid) {
      form.setFieldValue(name, defaultValue)
    } else if (contextNamespace !== undefined && isNamespaceAvailable(contextNamespace, namespaceData)) {
      form.setFieldValue(name, contextNamespace)
    }

    cascadeAppliedRef.current = true
  }, [namespaceData, defaultValue, contextNamespace, form, name])

  if (!namespaceData) {
    return null
  }

  const placeholder = defaultValue !== undefined ? `Default: ${defaultValue}` : 'Select namespace'

  return (
    <HiddenContainer name={name}>
      <Flex justify="space-between">
        <CustomSizeTitle $designNewLayout={designNewLayout}>
          namespace<Typography.Text type="danger">*</Typography.Text>
        </CustomSizeTitle>
        <Flex gap={4}>
          {isAdditionalProperties && (
            <Button size="small" type="text" onClick={() => removeField({ path: name })}>
              <MinusIcon />
            </Button>
          )}
          {defaultBtn.visible && (
            <DefaultValueButton
              defaultValue={defaultValue!}
              isApplied={defaultBtn.isApplied}
              onApply={defaultBtn.handleApply}
              onClear={defaultBtn.handleClear}
            />
          )}
        </Flex>
      </Flex>
      <ResetedFormItem
        name={name}
        rules={[getRequiredRule(true, name)]}
        validateTrigger="onBlur"
        hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
      >
        <Select
          placeholder={placeholder}
          options={namespaceData.selectValues}
          filterOption={namespaceData.filterSelectOptions}
          allowClear
          disabled={namespaceData.disabled}
          showSearch
        />
      </ResetedFormItem>
    </HiddenContainer>
  )
}
