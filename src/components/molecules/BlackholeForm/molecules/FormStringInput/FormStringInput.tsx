/* eslint-disable no-nested-ternary */
import React, { FC, useMemo } from 'react'
import { Flex, Input, Typography, Tooltip, Button, Form } from 'antd'
import { getStringByName } from 'utils/getStringByName'
import { isMultilineString } from 'utils/isMultilineString'
import { TFormName, TPersistedControls } from 'localTypes/form'
import { MinusIcon, feedbackIcons } from 'components/atoms'
import { PersistedCheckbox, HiddenContainer, ResetedFormItem, CustomSizeTitle } from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'

type TFormStringInputProps = {
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
}

export const FormStringInput: FC<TFormStringInputProps> = ({
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
}) => {
  const designNewLayout = useDesignNewLayout()

  const fixedName = name === 'nodeName' ? 'nodeNameBecauseOfSuddenBug' : name
  const formFieldName = arrName || fixedName
  const formValue = Form.useWatch(formFieldName)

  // Derive multiline based on current local value
  const isMultiline = useMemo(() => {
    // Normalize value for multiline check
    const value = typeof formValue === 'string' ? formValue : (formValue === null || formValue === undefined ? '' : String(formValue))
    return isMultilineString(value)
  }, [formValue])

  const title = (
    <>
      {getStringByName(name)}
      {required?.includes(getStringByName(name)) && <Typography.Text type="danger">*</Typography.Text>}
    </>
  )

  return (
    <HiddenContainer name={name}>
      <Flex justify="space-between">
        <CustomSizeTitle $designNewLayout={designNewLayout}>
          {description ? <Tooltip title={description}>{title}</Tooltip> : title}
        </CustomSizeTitle>
        <Flex gap={4}>
          {isAdditionalProperties && (
            <Button size="small" type="text" onClick={() => removeField({ path: name })}>
              <MinusIcon />
            </Button>
          )}
          {onRemoveByMinus && (
            <Button size="small" type="text" onClick={onRemoveByMinus}>
              <MinusIcon />
            </Button>
          )}
          <PersistedCheckbox formName={persistName || name} persistedControls={persistedControls} type="str" />
        </Flex>
      </Flex>
      <ResetedFormItem
        key={arrKey !== undefined ? arrKey : Array.isArray(name) ? name.slice(-1)[0] : name}
        name={arrName || fixedName}
        rules={[{ required: forceNonRequired === false && required?.includes(getStringByName(name)) }]}
        validateTrigger="onBlur"
        hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
        normalize={(value) => {
          // Normalize value to string - prevent "[object Object]" display
          if (value === undefined || value === null) {
            return ''
          }
          if (typeof value === 'string') {
            return value
          }
          if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value)
          }
          // If it's an object or array, it shouldn't be in a string field - return empty string
          if (typeof value === 'object') {
            return ''
          }
          return String(value)
        }}
      >
        <Input.TextArea
          placeholder={getStringByName(name)}
          rows={isMultiline ? 4 : 1}
          autoSize={!isMultiline ? { minRows: 1, maxRows: 1 } : { minRows: 2, maxRows: 10 }}
        />
      </ResetedFormItem>
    </HiddenContainer>
  )
}
