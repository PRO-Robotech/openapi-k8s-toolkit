import React, { FC } from 'react'
import { Button, Tooltip } from 'antd'

type TNullToggleButtonProps = {
  isNull: boolean
  onSetNull: () => void
  onClear: () => void
  disabled?: boolean
}

export const NullToggleButton: FC<TNullToggleButtonProps> = ({ isNull, onSetNull, onClear, disabled }) => {
  if (isNull) {
    return (
      <Tooltip title="Value will be sent as explicit null. Click to clear.">
        <Button size="small" type="link" disabled={disabled} onClick={onClear}>
          Clear null
        </Button>
      </Tooltip>
    )
  }

  return (
    <Tooltip title="Send this field as explicit null">
      <Button size="small" type="link" disabled={disabled} onClick={onSetNull}>
        Set null
      </Button>
    </Tooltip>
  )
}
