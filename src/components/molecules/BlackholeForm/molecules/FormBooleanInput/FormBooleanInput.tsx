/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
import React, { FC } from 'react'
import { Flex, Switch, Tooltip, Button, Typography } from 'antd'
import { getStringByName } from 'utils/getStringByName'
import { TFormName } from 'localTypes/form'
import { MinusIcon, BackToDefaultIcon } from 'components/atoms'
import { ResetedFormItem, CustomSizeTitle, HiddenContainer } from '../../atoms'
import { useDesignNewLayout } from '../../organisms/BlackholeForm/context'
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
        {defaultValue !== undefined && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Default: {String(defaultValue)}
          </Typography.Text>
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
