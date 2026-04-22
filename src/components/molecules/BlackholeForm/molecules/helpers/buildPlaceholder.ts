import { TFormName } from 'localTypes/form'
import { getStringByName } from 'utils/getStringByName'

export const formatDefaultValue = (defaultValue: string | number | boolean | string[]): string => {
  if (Array.isArray(defaultValue)) {
    return defaultValue.join(', ')
  }

  return String(defaultValue)
}

export const buildPlaceholder = (name: TFormName, defaultValue?: string | number | boolean | string[]): string => {
  if (defaultValue !== undefined) {
    return `Default: ${formatDefaultValue(defaultValue)}`
  }

  return getStringByName(name)
}
