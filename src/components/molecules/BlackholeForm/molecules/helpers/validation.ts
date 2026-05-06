import get from 'lodash/get'
import { Rule } from 'antd/es/form'
import { TFormSchemaOneOfBranch, TFormSchemaProperties } from 'localTypes/formSchema'
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

const formatOneOfGroup = (group: string[]) => `[${group.join(', ')}]`

const getOneOfRequiredGroupsMessage = (name: TFormName, groups: string[][]): string => {
  const groupText = groups.map(formatOneOfGroup).join(', ')
  return `Please provide exactly one of the following for ${prettyFieldPath(name)}: ${groupText}`
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

  const satisfiedGroups = groups.filter(group => group.every(path => isPresentForOneOf(get(value, path))))

  if (satisfiedGroups.length === 1) {
    return undefined
  }

  return getOneOfRequiredGroupsMessage(name, groups)
}

const formatOneOfBranchMatch = (branch: TFormSchemaOneOfBranch): string => {
  const matchEntries = Object.entries(branch.match || {})

  if (matchEntries.length === 0) {
    return 'selected branch'
  }

  return matchEntries.map(([path, expectedValue]) => `${path}=${String(expectedValue)}`).join(', ')
}

const matchesOneOfBranch = (value: unknown, branch: TFormSchemaOneOfBranch): boolean => {
  const matchEntries = Object.entries(branch.match || {})

  if (matchEntries.length === 0) {
    return false
  }

  return matchEntries.every(([path, expectedValue]) => get(value, path) === expectedValue)
}

const getOneOfBranchErrors = ({
  value,
  name,
  branches,
}: {
  value: unknown
  name: TFormName
  branches: TFormSchemaOneOfBranch[]
}): string[] => {
  if (!isPresentForOneOf(value)) {
    return []
  }

  const matchedBranches = branches.filter(branch => matchesOneOfBranch(value, branch))

  if (matchedBranches.length === 0) {
    return []
  }

  if (matchedBranches.length > 1) {
    const branchText = matchedBranches.map(formatOneOfBranchMatch).join(', ')
    return [`Please match exactly one branch for ${prettyFieldPath(name)}: ${branchText}`]
  }

  const [activeBranch] = matchedBranches
  const branchText = formatOneOfBranchMatch(activeBranch)
  const missingRequiredFields = (activeBranch.required || []).filter(path => !isPresentForOneOf(get(value, path)))
  const presentForbiddenFields = (activeBranch.forbidden || []).filter(path => isPresentForOneOf(get(value, path)))
  const errors: string[] = []

  if (missingRequiredFields.length > 0) {
    errors.push(
      `Please provide required fields for ${prettyFieldPath(name)} when ${branchText}: ${formatOneOfGroup(
        missingRequiredFields,
      )}`,
    )
  }

  if (presentForbiddenFields.length > 0) {
    errors.push(
      `Please remove forbidden fields for ${prettyFieldPath(name)} when ${branchText}: ${formatOneOfGroup(
        presentForbiddenFields,
      )}`,
    )
  }

  return errors
}

const getCurrentOneOfRequiredGroupState = ({
  path,
  nodeOneOfRequiredGroups,
  nodeOneOfBranches,
  value,
}: {
  path: (string | number)[]
  nodeOneOfRequiredGroups?: string[][]
  nodeOneOfBranches?: TFormSchemaOneOfBranch[]
  value: unknown
}): { name: TFormName; errors: string[] }[] => {
  const hasRequiredGroups = Boolean(nodeOneOfRequiredGroups && nodeOneOfRequiredGroups.length > 0)
  const hasBranches = Boolean(nodeOneOfBranches && nodeOneOfBranches.length > 0)

  if (!hasRequiredGroups && !hasBranches) {
    return []
  }

  const requiredGroupError = hasRequiredGroups
    ? getOneOfRequiredGroupsError({
        value,
        name: path,
        groups: nodeOneOfRequiredGroups || [],
      })
    : undefined
  const branchErrors = hasBranches
    ? getOneOfBranchErrors({
        value,
        name: path,
        branches: nodeOneOfBranches || [],
      })
    : []

  return [
    {
      name: path,
      errors: [...(requiredGroupError ? [requiredGroupError] : []), ...branchErrors],
    },
  ]
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
    const value = get(values, path)
    const currentState = getCurrentOneOfRequiredGroupState({
      path,
      nodeOneOfRequiredGroups: node.oneOfRequiredGroups,
      nodeOneOfBranches: node.oneOfBranches,
      value,
    })

    const nestedObjectStates =
      node.properties && value && typeof value === 'object' && !Array.isArray(value)
        ? collectOneOfRequiredGroupStates({
            properties: node.properties,
            values,
            currentPath: path,
          })
        : []

    const nestedArrayStates =
      node.type === 'array' && node.items && Array.isArray(value)
        ? value.flatMap((_, index) => [
            ...getCurrentOneOfRequiredGroupState({
              path: [...path, index],
              nodeOneOfRequiredGroups: node.items?.oneOfRequiredGroups,
              nodeOneOfBranches: node.items?.oneOfBranches,
              value: get(values, [...path, index]),
            }),
            ...(node.items?.properties
              ? collectOneOfRequiredGroupStates({
                  properties: node.items.properties,
                  values,
                  currentPath: [...path, index],
                })
              : []),
          ])
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

export const getPatternRule = (pattern: string | undefined, name: TFormName): Rule | undefined => {
  if (!pattern) {
    return undefined
  }

  let regexp: RegExp

  try {
    regexp = new RegExp(pattern)
  } catch {
    return undefined
  }

  const message = `Value must match pattern for ${prettyFieldPath(name)}: ${pattern}`

  return {
    validator: async (_, value) => {
      if (value === undefined || value === null || value === '') return
      if (typeof value !== 'string') return
      if (!regexp.test(value)) {
        throw new Error(message)
      }
    },
  }
}

export const getNumberRangeRule = ({
  minimum,
  maximum,
  name,
}: {
  minimum?: number
  maximum?: number
  name: TFormName
}): Rule | undefined => {
  if (minimum === undefined && maximum === undefined) {
    return undefined
  }

  let message = `Value must be at most ${maximum} for ${prettyFieldPath(name)}`

  if (minimum !== undefined && maximum !== undefined) {
    message = `Value must be between ${minimum} and ${maximum} for ${prettyFieldPath(name)}`
  } else if (minimum !== undefined) {
    message = `Value must be at least ${minimum} for ${prettyFieldPath(name)}`
  }

  return {
    validator: async (_, value) => {
      if (value === undefined || value === null || value === '') return
      if (typeof value !== 'number') return
      if (minimum !== undefined && value < minimum) {
        throw new Error(message)
      }
      if (maximum !== undefined && value > maximum) {
        throw new Error(message)
      }
    },
  }
}
