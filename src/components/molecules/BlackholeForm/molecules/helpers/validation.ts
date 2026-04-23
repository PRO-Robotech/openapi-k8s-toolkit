import { Rule } from 'antd/es/form'
import { TFormName } from 'localTypes/form'

export const prettyFieldPath = (name: TFormName): string => {
  return Array.isArray(name) ? name.map(segment => String(segment)).join('.') : String(name)
}

const isEmptyValue = (value: unknown): boolean =>
  value === undefined || value === '' || (Array.isArray(value) && value.length === 0)

/**
 * Returns an antd Form rule for a required field. When `nullable` is true, an explicit
 * `null` is accepted as a valid value (it will be serialized as JSON null in the payload).
 * For non-nullable fields, the standard antd `required: true` semantics apply — null is
 * treated as empty, same as undefined/''/[].
 */
export const getRequiredRule = (isRequired: boolean, name: TFormName, nullable?: boolean): Rule => {
  const message = `Please enter ${prettyFieldPath(name)}`

  if (!isRequired) {
    return { required: false, message }
  }

  if (nullable) {
    return {
      required: true,
      message,
      validator: async (_, value) => {
        if (value === null) return
        if (isEmptyValue(value)) {
          throw new Error(message)
        }
      },
    }
  }

  return { required: true, message }
}
