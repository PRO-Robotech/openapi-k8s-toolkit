import { TFormName } from 'localTypes/form'

export const prettyFieldPath = (name: TFormName): string => {
  return Array.isArray(name) ? name.map(segment => String(segment)).join('.') : String(name)
}

export const getRequiredRule = (isRequired: boolean, name: TFormName) => {
  return {
    required: isRequired,
    message: `Please enter ${prettyFieldPath(name)}`,
  }
}
