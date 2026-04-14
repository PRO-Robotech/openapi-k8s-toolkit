/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
import React, { FC } from 'react'
import { Flex, Switch, Tooltip, Button } from 'antd'
import { getStringByName } from 'utils/getStringByName'
import { TFormName } from 'localTypes/form'
import { MinusIcon, BackToDefaultIcon } from 'components/atoms'
import { ResetedFormItem, CustomSizeTitle, HiddenContainer, DefaultValueButton } from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'
import { useDefaultValueButton } from '../helpers/useDefaultValueButton'
import { Styled } from './styled'

type TFormBooleanInputProps = {
  name: TFormName
  arrKey?: number
  arrName?: TFormName
  description?: string
  makeValueUndefined?: (path: TFormName) => void
  isAdditionalProperties?: boolean
  removeField: ({ path }: { path: TFormName }) => void
  onRemoveByMinus?: () => void
  /**
   * OpenAPI schema `default` value for this field.
   * Wired through in Stage 1; will drive placeholder display and the
   * "apply default" button in Stage 2/4.
   */
  defaultValue?: boolean
}

export const FormBooleanInput: FC<TFormBooleanInputProps> = ({
  name,
  arrKey,
  arrName,
  description,
  makeValueUndefined,
  isAdditionalProperties,
  removeField,
  onRemoveByMinus,
  defaultValue,
}) => {
  const designNewLayout = useDesignNewLayout()
  const formFieldName = arrName || name
  const defaultBtn = useDefaultValueButton(formFieldName, defaultValue)

  const title = <>{getStringByName(name)}</>

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
        </Flex>
      </Flex>
      <Styled.SwitchAndCrossContainer>
        <ResetedFormItem
          key={arrKey !== undefined ? arrKey : Array.isArray(name) ? name.slice(-1)[0] : name}
          name={arrName || name}
        >
          <Switch size="small" />
        </ResetedFormItem>
        {defaultBtn.visible && (
          <DefaultValueButton
            defaultValue={defaultValue!}
            isApplied={defaultBtn.isApplied}
            onApply={defaultBtn.handleApply}
            onClear={defaultBtn.handleClear}
          />
        )}
        <Styled.CrossContainer
          onClick={() => {
            if (makeValueUndefined) {
              makeValueUndefined(name)
            }
          }}
        >
          <BackToDefaultIcon />
        </Styled.CrossContainer>
      </Styled.SwitchAndCrossContainer>
    </HiddenContainer>
  )
}
