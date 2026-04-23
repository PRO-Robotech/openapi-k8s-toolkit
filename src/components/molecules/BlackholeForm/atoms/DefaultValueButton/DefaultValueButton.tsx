import React, { FC } from 'react'
import { Button, Tooltip } from 'antd'

type TDefaultValueButtonProps = {
  /**
   * The default value coming from the OpenAPI schema. Used in the tooltip so
   * the user can see what would be applied / what was applied.
   */
  defaultValue: string | number | boolean | string[]
  /**
   * Whether the form field currently holds the default value.
   * - false → render the "Apply default" affordance (sets the field to defaultValue)
   * - true  → render the "Clear" affordance (resets the field back to empty,
   *           which means the K8s API server will substitute the default itself)
   */
  isApplied: boolean
  /**
   * Called when the user clicks the apply-default button (isApplied=false).
   */
  onApply: () => void
  /**
   * Called when the user clicks the clear button (isApplied=true).
   */
  onClear: () => void
  disabled?: boolean
}

const formatDefault = (value: TDefaultValueButtonProps['defaultValue']): string => {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return String(value)
}

/**
 * Renders a tiny text button next to a form field that lets the user apply
 * the OpenAPI schema's `default` value with one click, or clear it once
 * applied.
 *
 * The parent decides *whether* this button should appear at all — typically
 * it should be hidden when the field already holds a user-entered value or
 * a prefill from CustomFormsPrefills, since prefills take precedence over
 * schema defaults.
 */
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
