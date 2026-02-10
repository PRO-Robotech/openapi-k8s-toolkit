/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
import React, { FC, useState, useEffect } from 'react'
import { Flex, InputNumber, Typography, Tooltip, Row, Col, Slider, Button } from 'antd'
import { SliderBaseProps } from 'antd/es/slider'
import { TFormName, TPersistedControls } from 'localTypes/form'
import { getStringByName } from 'utils/getStringByName'
import { MinusIcon, feedbackIcons } from 'components/atoms'
import { PersistedCheckbox, HiddenContainer, ResetedFormItem, CustomSizeTitle } from '../../../../atoms'
import { useDesignNewLayout } from '../../../../organisms/BlackholeForm/context'
import { getRequiredRule } from '../../../helpers/validation'

export type TRangeInputProps = {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  persistName?: TFormName
  required?: string[]
  forceNonRequired?: boolean
  persistedControls: TPersistedControls
  description?: string
  onRemoveByMinus?: () => void
  max: number
  min: number
  step?: number
  initialValue?: number
} & SliderBaseProps

export const RangeInput: FC<TRangeInputProps> = ({
  name,
  arrKey,
  arrName,
  persistName,
  required,
  forceNonRequired,
  persistedControls,
  description,
  onRemoveByMinus,
  initialValue,
  max,
  min,
  step = 1,
  ...props
}) => {
  const designNewLayout = useDesignNewLayout()

  const [value, setValue] = useState<number>(initialValue || min)

  useEffect(() => {
    if (Number.isNaN(value) || value < min) {
      setValue(min)
    }
    if (value > max) {
      setValue(max)
    }

    setValue(value)
  }, [value, min, max])

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
          {onRemoveByMinus && (
            <Button size="small" type="text" onClick={onRemoveByMinus}>
              <MinusIcon />
            </Button>
          )}
          <PersistedCheckbox formName={persistName || name} persistedControls={persistedControls} type="number" />
        </Flex>
      </Flex>
      <Row>
        <Col span={12}>
          <ResetedFormItem
            key={arrKey !== undefined ? arrKey : Array.isArray(name) ? name.slice(-1)[0] : name}
            name={arrName || name}
            rules={[getRequiredRule(forceNonRequired === false && !!required?.includes(getStringByName(name)), name)]}
            validateTrigger="onBlur"
            hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
          >
            <Slider min={min} max={max} step={step} {...props} />
          </ResetedFormItem>
          <Typography.Text>
            <Flex justify="space-between">
              <span>{min}</span>
              <span>{max}</span>
            </Flex>
          </Typography.Text>
        </Col>
        <Col span={4}>
          <ResetedFormItem
            key={arrKey !== undefined ? arrKey : Array.isArray(name) ? name.slice(-1)[0] : name}
            name={arrName || name}
            rules={[getRequiredRule(forceNonRequired === false && !!required?.includes(getStringByName(name)), name)]}
            validateTrigger="onBlur"
            hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
          >
            <InputNumber min={min} max={max} step={step} value={value} disabled={props.disabled} />
          </ResetedFormItem>
        </Col>
      </Row>
    </HiddenContainer>
  )
}
