import { TFormName } from 'localTypes/form'
import { getStringByName } from 'utils/getStringByName'

export type TDisplayableDefaultValue = string | number | boolean | string[]

export const hasActionableDefaultValue = (
  defaultValue: TDisplayableDefaultValue | undefined,
): defaultValue is TDisplayableDefaultValue => {
  if (defaultValue === undefined) return false
  if (defaultValue === '') return false
  if (Array.isArray(defaultValue) && defaultValue.length === 0) return false

  return true
}

export const formatDefaultValue = (defaultValue: TDisplayableDefaultValue): string => {
  if (Array.isArray(defaultValue)) {
    return defaultValue.join(', ')
  }

  return String(defaultValue)
}

export const buildPlaceholder = (
  name: TFormName,
  defaultValue?: TDisplayableDefaultValue,
  example?: TDisplayableDefaultValue,
): string => {
  if (hasActionableDefaultValue(defaultValue)) {
    return `Default: ${formatDefaultValue(defaultValue)}`
  }

  if (example !== undefined) {
    return `Example: ${formatDefaultValue(example)}`
  }

  return getStringByName(name)
}

/**
 * Returns a tooltip body with the example when both `default` and `example` are set —
 * `default` occupies the placeholder, so `example` would otherwise be lost. Returns
 * `undefined` when no dedicated tooltip is needed (example is either absent or already
 * surfaced as the placeholder).
 */
export const getExampleTooltip = (
  defaultValue?: TDisplayableDefaultValue,
  example?: TDisplayableDefaultValue,
): string | undefined => {
  if (example === undefined) return undefined
  if (!hasActionableDefaultValue(defaultValue)) return undefined

  return `Example: ${formatDefaultValue(example)}`
}
