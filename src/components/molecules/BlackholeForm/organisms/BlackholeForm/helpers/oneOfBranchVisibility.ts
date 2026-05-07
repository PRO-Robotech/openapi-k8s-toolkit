import get from 'lodash/get'
import { TFormSchemaNode, TFormSchemaProperties } from 'localTypes/formSchema'
import { collectInactiveOneOfBranchPaths, matchesOneOfBranch } from '../../../molecules/helpers/oneOfBranch'

const isPresentForOneOfBranchVisibility = (value: unknown): boolean => {
  if (value === null) return true
  if (value === undefined) return false
  if (typeof value === 'string') return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0

  return true
}

const getCurrentNodeHiddenPaths = ({
  node,
  value,
  path,
}: {
  node: TFormSchemaNode
  value: unknown
  path: (string | number)[]
}): (string | number)[][] => {
  if (!node.oneOfBranches || node.oneOfBranches.length === 0) {
    return []
  }

  const matchedBranches = node.oneOfBranches.filter(branch => matchesOneOfBranch(value, branch))

  if (matchedBranches.length !== 1) {
    return []
  }

  const [activeBranch] = matchedBranches
  return collectInactiveOneOfBranchPaths({ branches: node.oneOfBranches, activeBranch })
    .filter(branchPath => !isPresentForOneOfBranchVisibility(get(value, branchPath)))
    .map(branchPath => [...path, ...branchPath])
}

export const collectOneOfBranchHiddenPaths = ({
  properties,
  values,
  currentPath = [],
}: {
  properties: TFormSchemaProperties
  values: Record<string, unknown>
  currentPath?: (string | number)[]
}): (string | number)[][] => {
  return Object.entries(properties).flatMap(([key, node]) => {
    const path = [...currentPath, key]
    const value = get(values, path)
    const currentHiddenPaths = getCurrentNodeHiddenPaths({
      node,
      value,
      path,
    })

    const nestedObjectHiddenPaths = node.properties
      ? collectOneOfBranchHiddenPaths({
          properties: node.properties,
          values,
          currentPath: path,
        })
      : []

    const nestedArrayHiddenPaths =
      node.type === 'array' && node.items && Array.isArray(value)
        ? value.flatMap((_, index) => {
            const itemPath = [...path, index]
            const itemValue = get(values, itemPath)
            const itemHiddenPaths = getCurrentNodeHiddenPaths({
              node: node.items as TFormSchemaNode,
              value: itemValue,
              path: itemPath,
            })

            return [
              ...itemHiddenPaths,
              ...(node.items?.properties
                ? collectOneOfBranchHiddenPaths({
                    properties: node.items.properties,
                    values,
                    currentPath: itemPath,
                  })
                : []),
            ]
          })
        : []

    return [...currentHiddenPaths, ...nestedObjectHiddenPaths, ...nestedArrayHiddenPaths]
  })
}
