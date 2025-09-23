/* eslint-disable no-nested-ternary */
import React, { FC, useState, useEffect } from 'react'
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
  const [isMultiline, setIsMultiline] = useState(false)
  const [currentValue, setCurrentValue] = useState<string>('')

  const fixedName = name === 'nodeName' ? 'nodeNameBecauseOfSuddenBug' : name
  const formFieldName = arrName || fixedName

  // Watch the form field value
  const formValue = Form.useWatch(formFieldName)

  // Initialize multiline state based on form value
  useEffect(() => {
    if (formValue && typeof formValue === 'string') {
      setCurrentValue(formValue)
      if (isMultilineString(formValue)) {
        setIsMultiline(true)
      }
    }
  }, [formValue])

  // Check if the current value should be multiline
  useEffect(() => {
    if (currentValue && isMultilineString(currentValue)) {
      setIsMultiline(true)
    }
  }, [currentValue])

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
      >
        <Input.TextArea
          placeholder={getStringByName(name)}
          rows={isMultiline ? 4 : 1}
          autoSize={!isMultiline ? { minRows: 1, maxRows: 1 } : { minRows: 2, maxRows: 10 }}
          onChange={(e) => {
            const value = e.target.value
            setCurrentValue(value)
          }}
          onKeyPress={(e) => {
            // If user presses Enter in single-line mode, switch to multiline
            if (!isMultiline && e.key === 'Enter' && !e.shiftKey) {
              // Don't prevent default - let the newline be added
              setIsMultiline(true)
            }
          }}
          onInput={(e) => {
            // Handle input changes and check for newlines
            const value = (e.target as HTMLTextAreaElement).value
            setCurrentValue(value)
            
            // If we detect a newline and we're in single-line mode, switch to multiline
            if (!isMultiline && value.includes('\n')) {
              setIsMultiline(true)
            }
          }}
          onBlur={(e) => {
            // If the value becomes single line, switch back to single-line mode
            if (isMultilineString(e.target.value)) {
              setIsMultiline(true)
            } else {
              setIsMultiline(false)
            }
          }}
          onPaste={(e) => {
            // Handle paste of multiline content
            const pastedText = e.clipboardData.getData('text')
            if (pastedText && isMultilineString(pastedText)) {
              // Let the default paste behavior happen, but ensure multiline mode
              setTimeout(() => {
                setIsMultiline(true)
              }, 0)
            }
          }}
        />
      </ResetedFormItem>
    </HiddenContainer>
  )
}
