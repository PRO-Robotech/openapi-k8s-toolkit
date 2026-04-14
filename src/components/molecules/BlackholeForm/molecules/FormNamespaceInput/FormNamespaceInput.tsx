import React, { FC } from 'react'
import { Flex, Typography, Select, Button } from 'antd'
import { TFormName, TNamespaceData } from 'localTypes/form'
import { MinusIcon, feedbackIcons } from 'components/atoms'
import { CustomSizeTitle, HiddenContainer, ResetedFormItem, DefaultValueButton } from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'
import { getRequiredRule } from '../helpers/validation'
import { useDefaultValueButton } from '../helpers/useDefaultValueButton'

type TFormNamespaceInputProps = {
  name: TFormName
  namespaceData: TNamespaceData
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  /**
   * OpenAPI schema `default` value for this field.
   * Wired through in Stage 1; will drive placeholder display and the
   * "apply default" button in Stage 2/4/5.
   */
  defaultValue?: string
}

export const FormNamespaceInput: FC<TFormNamespaceInputProps> = ({
  name,
  namespaceData,
  isAdditionalProperties,
  removeField,
  defaultValue,
}) => {
  const designNewLayout = useDesignNewLayout()
  const defaultBtn = useDefaultValueButton(name, defaultValue)

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
              onApply={defaultBtn.onApply}
              onClear={defaultBtn.onClear}
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
