import React, { FC } from 'react'
import { Button, Tooltip } from 'antd'

type TDefaultValueButtonProps = {
  defaultValue: string | number | boolean | string[]
  isApplied: boolean
  onApply: () => void
  onClear: () => void
  disabled?: boolean
}

const formatDefault = (value: TDefaultValueButtonProps['defaultValue']): string => {
  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return String(value)
}

export const DefaultValueButton: FC<TDefaultValueButtonProps> = ({
  defaultValue,
  isApplied,
  onApply,
  onClear,
  disabled,
}) => {
  const formatted = formatDefault(defaultValue)

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
