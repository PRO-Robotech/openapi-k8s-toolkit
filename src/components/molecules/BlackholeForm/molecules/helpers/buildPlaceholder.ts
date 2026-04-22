import { TFormName } from 'localTypes/form'
import { getStringByName } from 'utils/getStringByName'

export const buildPlaceholder = (name: TFormName, defaultValue?: string | number | boolean): string => {
  if (defaultValue !== undefined) {
    return `Default: ${String(defaultValue)}`
  }

  return getStringByName(name)
}
