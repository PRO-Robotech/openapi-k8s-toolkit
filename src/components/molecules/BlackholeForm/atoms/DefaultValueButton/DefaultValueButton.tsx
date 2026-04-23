import React, { FC } from 'react'
import { Button, Tooltip } from 'antd'
import { formatDefaultValue } from '../../molecules/helpers/buildPlaceholder'

type TDefaultValueButtonProps = {
  defaultValue: string | number | boolean | string[]
  isApplied: boolean
  onApply: () => void
  onClear: () => void
  disabled?: boolean
}

export const DefaultValueButton: FC<TDefaultValueButtonProps> = ({
  defaultValue,
  isApplied,
  onApply,
  onClear,
  disabled,
}) => {
  const formatted = formatDefaultValue(defaultValue)

  if (isApplied) {
    return (
      <Tooltip title={`Server will substitute default: ${formatted}`}>
        <Button size="small" type="link" disabled={disabled} onClick={onClear}>
          Clear
        </Button>
      </Tooltip>
    )
  }

  return (
    <Tooltip title={`Will set field to: ${formatted}`}>
      <Button size="small" type="link" disabled={disabled} onClick={onApply}>
        Apply default
      </Button>
    </Tooltip>
  )
}
