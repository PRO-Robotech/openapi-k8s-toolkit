/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
import React, { FC } from 'react'
import { Flex, Typography, Tooltip, Select, Button } from 'antd'
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
import { getRequiredRule } from '../helpers/validation'

type TFormEnumStringInputProps = {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  persistName?: TFormName
  required?: string[]
  forceNonRequired?: boolean
  description?: string
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  options: string[]
  persistedControls: TPersistedControls
  onRemoveByMinus?: () => void
  defaultValue?: string
  example?: string
  nullable?: boolean
}

export const FormEnumStringInput: FC<TFormEnumStringInputProps> = ({
  name,
  arrKey,
  arrName,
  persistName,
  required,
  forceNonRequired,
  description,
  isAdditionalProperties,
  removeField,
  options,
  persistedControls,
  onRemoveByMinus,
  defaultValue,
  example,
  nullable,
}) => {
  const designNewLayout = useDesignNewLayout()

  const fixedName = name === 'nodeName' ? 'nodeNameBecauseOfSuddenBug' : name
  const formFieldName = arrName || fixedName
  const defaultBtn = useDefaultValueButton(formFieldName, defaultValue, nullable)
  const nullBtn = useNullToggleButton(formFieldName, nullable)
  const exampleTooltip = getExampleTooltip(defaultValue, example)

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
          <PersistedCheckbox formName={persistName || name} persistedControls={persistedControls} type="str" />
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
        ]}
        validateTrigger="onBlur"
        hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
      >
        <Select
          options={options.map(el => ({ value: el, label: el }))}
          placeholder={buildPlaceholder(name, defaultValue, example)}
          disabled={nullBtn.visible && nullBtn.isNull}
        />
      </ResetedFormItem>
    </HiddenContainer>
  )
}
