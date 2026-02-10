/* eslint-disable no-nested-ternary */
// import React, { FC, useState, useEffect, useMemo } from 'react'
import React, { FC, useState, useEffect } from 'react'
import { Flex, Input, Typography, Tooltip, Button, Form } from 'antd'
import { getStringByName } from 'utils/getStringByName'
// import { isMultilineString } from 'utils/isMultilineString'
import { TFormName, TPersistedControls } from 'localTypes/form'
import { MinusIcon, feedbackIcons } from 'components/atoms'
import { PersistedCheckbox, HiddenContainer, ResetedFormItem, CustomSizeTitle } from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'
import { toBase64, fromBase64 } from './helpers'
import { Styled } from './styled'
import { getRequiredRule } from '../helpers/validation'

type TFormStringMultilineInputProps = {
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
}

export const FormStringMultilineInput: FC<TFormStringMultilineInputProps> = ({
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
}) => {
  const designNewLayout = useDesignNewLayout()

  const fixedName = name === 'nodeName' ? 'nodeNameBecauseOfSuddenBug' : name
  const formFieldName = arrName || fixedName
  const formValue = Form.useWatch(formFieldName)
  const form = Form.useFormInstance()

  // Derive multiline based on current local value
  // const isMultiline = useMemo(() => isMultilineString(formValue), [formValue])

  const title = (
    <>
      {getStringByName(name)}
      {required?.includes(getStringByName(name)) && <Typography.Text type="danger">*</Typography.Text>}
    </>
  )

  const [decoded, setDecoded] = useState('')

  useEffect(() => {
    try {
      const decodedText = formValue ? fromBase64(formValue) : ''
      setDecoded(decodedText)
    } catch {
      setDecoded('') // clear on error so UI isn't stale
    }
  }, [formValue])

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
        rules={[getRequiredRule(forceNonRequired === false && !!required?.includes(getStringByName(name)), name)]}
        validateTrigger="onBlur"
        hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
        style={{
          display: isBase64 ? 'none' : 'inherit',
        }}
      >
        <Input.TextArea
          placeholder={getStringByName(name)}
          // rows={isMultiline ? 4 : 1}
          rows={4}
          // autoSize={!isMultiline ? { minRows: 1, maxRows: 1 } : { minRows: 2, maxRows: 10 }}
          autoSize={{ minRows: 2, maxRows: 10 }}
        />
      </ResetedFormItem>
      {isBase64 && (
        <Styled.MarginBottom>
          <Input.TextArea
            placeholder={getStringByName(name)}
            value={decoded}
            onChange={e => {
              try {
                form.setFieldValue(formFieldName, toBase64(e.target.value))
                setDecoded(e.target.value) // keep in sync immediately
              } catch {
                // optional: surface a message via antd or keep silent
              }
            }}
            // rows={isMultiline ? 4 : 1}
            rows={4}
            // autoSize={!isMultiline ? { minRows: 1, maxRows: 1 } : { minRows: 2, maxRows: 10 }}
            autoSize={{ minRows: 2, maxRows: 10 }}
          />
        </Styled.MarginBottom>
      )}
    </HiddenContainer>
  )
}
