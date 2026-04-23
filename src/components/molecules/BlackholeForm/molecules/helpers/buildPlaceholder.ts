import { TFormName } from 'localTypes/form'
import { getStringByName } from 'utils/getStringByName'

export const formatDefaultValue = (defaultValue: string | number | boolean | string[]): string => {
  if (Array.isArray(defaultValue)) {
    return defaultValue.join(', ')
  }

  return String(defaultValue)
}

export const buildPlaceholder = (
  name: TFormName,
  defaultValue?: string | number | boolean | string[],
  example?: string | number | boolean | string[],
): string => {
  if (defaultValue !== undefined) {
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
  defaultValue?: string | number | boolean | string[],
  example?: string | number | boolean | string[],
): string | undefined => {
  if (example === undefined) return undefined
  if (defaultValue === undefined) return undefined

  return `Example: ${formatDefaultValue(example)}`
}
