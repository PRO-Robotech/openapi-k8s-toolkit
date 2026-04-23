import { TFormName } from 'localTypes/form'
import { getStringByName } from 'utils/getStringByName'

/**
 * Builds the placeholder string for form field inputs.
 *
 * If an OpenAPI schema `default` is provided, the placeholder surfaces it as
 * a hint (e.g. `Default: TCP`) so the user knows what the API server will
 * substitute if they leave the field empty. Otherwise the placeholder falls
 * back to the field name, matching the pre-existing behavior.
 *
 * The field stays technically empty — this is a visual hint only. Applying
 * the default as a real value is handled by the DefaultValueButton.
 */
export const buildPlaceholder = (name: TFormName, defaultValue?: string | number | boolean): string => {
  if (defaultValue !== undefined) {
    return `Default: ${String(defaultValue)}`
  }
  return getStringByName(name)
}
