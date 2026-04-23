import _ from 'lodash'
import { Rule } from 'antd/es/form'
import { TFormSchemaProperties } from 'localTypes/formSchema'
import { TFormName } from 'localTypes/form'

export const prettyFieldPath = (name: TFormName): string => {
  return Array.isArray(name) ? name.map(segment => String(segment)).join('.') : String(name)
}

const isEmptyValue = (value: unknown): boolean =>
  value === undefined || value === '' || (Array.isArray(value) && value.length === 0)

const isPresentForOneOf = (value: unknown): boolean => {
  if (value === null) return true
  if (value === undefined) return false
  if (typeof value === 'string') return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0

  return true
}

const formatOneOfGroup = (group: string[]) => group.join(' and ')

const getOneOfRequiredGroupsMessage = (name: TFormName, groups: string[][]): string => {
  const groupText = groups.map(formatOneOfGroup).join(' or ')
  return `Please satisfy exactly one of the following for ${prettyFieldPath(name)}: ${groupText}`
}

const getOneOfRequiredGroupsError = ({
  value,
  name,
  groups,
}: {
  value: unknown
  name: TFormName
  groups: string[][]
}): string | undefined => {
  if (!isPresentForOneOf(value)) {
    return undefined
  }

  const satisfiedGroups = groups.filter(group => group.every(path => isPresentForOneOf(_.get(value, path))))

  if (satisfiedGroups.length === 1) {
    return undefined
  }

  return getOneOfRequiredGroupsMessage(name, groups)
}

export const collectOneOfRequiredGroupStates = ({
  properties,
  values,
  currentPath = [],
}: {
  properties: TFormSchemaProperties
  values: Record<string, unknown>
  currentPath?: (string | number)[]
}): { name: TFormName; errors: string[] }[] => {
  return Object.entries(properties).flatMap(([key, node]) => {
    const path = [...currentPath, key]
    const value = _.get(values, path)
    const currentState =
      node.oneOfRequiredGroups && node.oneOfRequiredGroups.length > 0
        ? [
            {
              name: path,
              errors: (() => {
                const error = getOneOfRequiredGroupsError({
                  value,
                  name: path,
                  groups: node.oneOfRequiredGroups,
                })

                return error ? [error] : []
              })(),
            },
          ]
        : []

    const nestedObjectStates =
      node.properties && value && typeof value === 'object' && !Array.isArray(value)
        ? collectOneOfRequiredGroupStates({
            properties: node.properties,
            values,
            currentPath: path,
          })
        : []

    const nestedArrayStates =
      node.type === 'array' && node.items?.properties && Array.isArray(value)
        ? value.flatMap((_, index) =>
            collectOneOfRequiredGroupStates({
              properties: node.items!.properties!,
              values,
              currentPath: [...path, index],
            }),
          )
        : []

    return [...currentState, ...nestedObjectStates, ...nestedArrayStates]
  })
}

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
