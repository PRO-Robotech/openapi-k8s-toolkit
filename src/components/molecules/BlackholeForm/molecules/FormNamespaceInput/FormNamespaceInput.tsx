import React, { FC } from 'react'
import { Flex, Typography, Select, Button } from 'antd'
import { TFormName, TNamespaceData } from 'localTypes/form'
import { MinusIcon, feedbackIcons } from 'components/atoms'
import { CustomSizeTitle, HiddenContainer, ResetedFormItem } from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'
import { getRequiredRule } from '../helpers/validation'

type TFormNamespaceInputProps = {
  name: TFormName
  namespaceData: TNamespaceData
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
}

export const FormNamespaceInput: FC<TFormNamespaceInputProps> = ({
  name,
  namespaceData,
  isAdditionalProperties,
  removeField,
}) => {
  const designNewLayout = useDesignNewLayout()

  if (!namespaceData) {
    return null
  }

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
        </Flex>
      </Flex>
      <ResetedFormItem
        name={name}
        rules={[getRequiredRule(true, name)]}
        validateTrigger="onBlur"
        hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
      >
        <Select
          placeholder="Select namespace"
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
