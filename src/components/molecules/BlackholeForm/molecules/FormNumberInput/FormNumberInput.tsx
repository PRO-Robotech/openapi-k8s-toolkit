/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
import React, { FC } from 'react'
import { Flex, InputNumber, Typography, Tooltip, Button } from 'antd'
import { getStringByName } from 'utils/getStringByName'
import { TFormName, TPersistedControls } from 'localTypes/form'
import { MinusIcon, feedbackIcons } from 'components/atoms'
import { PersistedCheckbox, HiddenContainer, ResetedFormItem, CustomSizeTitle, DefaultValueButton } from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'
import { getRequiredRule } from '../helpers/validation'
import { buildPlaceholder } from '../helpers/buildPlaceholder'
import { useDefaultValueButton } from '../helpers/useDefaultValueButton'

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
  /**
   * OpenAPI schema `default` value for this field.
   * Wired through in Stage 1; will drive placeholder display and the
   * "apply default" button in Stage 2/4.
   */
  defaultValue?: number
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
}) => {
  const designNewLayout = useDesignNewLayout()
  const formFieldName = arrName || name
  const defaultBtn = useDefaultValueButton(formFieldName, defaultValue)

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
          <PersistedCheckbox formName={persistName || name} persistedControls={persistedControls} type="number" />
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
        key={arrKey !== undefined ? arrKey : Array.isArray(name) ? name.slice(-1)[0] : name}
        name={formFieldName}
        rules={[getRequiredRule(forceNonRequired === false && !!required?.includes(getStringByName(name)), name)]}
        validateTrigger="onBlur"
        hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
      >
        <InputNumber placeholder={buildPlaceholder(name, defaultValue)} step={isNumber ? 0.1 : 1} />
      </ResetedFormItem>
    </HiddenContainer>
  )
}
