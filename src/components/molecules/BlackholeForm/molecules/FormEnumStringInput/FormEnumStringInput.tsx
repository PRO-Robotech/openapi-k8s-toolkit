/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
import React, { FC } from 'react'
import { Flex, Typography, Tooltip, Select, Button } from 'antd'
import { getStringByName } from 'utils/getStringByName'
import { TFormName, TPersistedControls } from 'localTypes/form'
import { MinusIcon, feedbackIcons } from 'components/atoms'
import { PersistedCheckbox, HiddenContainer, ResetedFormItem, CustomSizeTitle } from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'
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
}) => {
  const designNewLayout = useDesignNewLayout()

  const fixedName = name === 'nodeName' ? 'nodeNameBecauseOfSuddenBug' : name

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
        rules={[getRequiredRule(forceNonRequired === false && !!required?.includes(getStringByName(name)), name)]}
        validateTrigger="onBlur"
        hasFeedback={designNewLayout ? { icons: feedbackIcons } : true}
      >
        <Select options={options.map(el => ({ value: el, label: el }))} placeholder={getStringByName(name)} />
      </ResetedFormItem>
    </HiddenContainer>
  )
}
