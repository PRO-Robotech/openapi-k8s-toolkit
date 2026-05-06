/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
import React, { FC } from 'react'
import { Flex, InputNumber, Typography, Tooltip, Button } from 'antd'
import { getStringByName } from 'utils/getStringByName'
import { TFormName, TPersistedControls } from 'localTypes/form'
import { MinusIcon, feedbackIcons } from 'components/atoms'
import {
  PersistedCheckbox,
  HiddenContainer,
  ResetedFormItem,
  CustomSizeTitle,
  DefaultValueButton,
  ExampleTooltipIcon,
  NullToggleButton,
} from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'
import { buildPlaceholder, getExampleTooltip } from '../helpers/buildPlaceholder'
import { useDefaultValueButton } from '../helpers/useDefaultValueButton'
import { useNullToggleButton } from '../helpers/useNullToggleButton'
import { getNumberFormatRule, getNumberRangeRule, getRequiredRule } from '../helpers/validation'

type TFormNumberItemProps = {
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
}

export const FormNumberInput: FC<TFormNumberItemProps> = ({
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
}) => {
  const designNewLayout = useDesignNewLayout()
  const formFieldName = arrName || name
  const defaultBtn = useDefaultValueButton(formFieldName, defaultValue, nullable)
  const nullBtn = useNullToggleButton(formFieldName, nullable)
  const exampleTooltip = getExampleTooltip(defaultValue, example)
  const formatRule = getNumberFormatRule(format, name)
  const rangeRule = getNumberRangeRule({ minimum, maximum, name })

  const title = (
    <>
      {getStringByName(name)}
      {required?.includes(getStringByName(name)) && <Typography.Text type="danger">*</Typography.Text>}
      {exampleTooltip && <ExampleTooltipIcon tooltip={exampleTooltip} />}
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
          <PersistedCheckbox formName={persistName || name} persistedControls={persistedControls} type="number" />
          {defaultBtn.visible && (
            <DefaultValueButton
              defaultValue={defaultValue!}
              isApplied={defaultBtn.isApplied}
              onApply={defaultBtn.handleApply}
              onClear={defaultBtn.handleClear}
            />
          )}
          {nullBtn.visible && (
            <NullToggleButton isNull={nullBtn.isNull} onSetNull={nullBtn.handleSetNull} onClear={nullBtn.handleClear} />
          )}
        </Flex>
      </Flex>
      <ResetedFormItem
        key={arrKey !== undefined ? arrKey : Array.isArray(name) ? name.slice(-1)[0] : name}
        name={formFieldName}
        rules={[
          getRequiredRule(forceNonRequired === false && !!required?.includes(getStringByName(name)), name, nullable),
          ...(formatRule ? [formatRule] : []),
          ...(rangeRule ? [rangeRule] : []),
        ]}
        validateTrigger="onBlur"
        hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
      >
        <InputNumber
          placeholder={buildPlaceholder(name, defaultValue, example)}
          step={isNumber ? 0.1 : 1}
          min={minimum}
          max={maximum}
          disabled={nullBtn.visible && nullBtn.isNull}
        />
      </ResetedFormItem>
    </HiddenContainer>
  )
}
