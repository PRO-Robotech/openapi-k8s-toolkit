import get from 'lodash/get'
import { TFormSchemaNode, TFormSchemaOneOfBranch, TFormSchemaProperties } from 'localTypes/formSchema'

const isPresentForOneOfBranchVisibility = (value: unknown): boolean => {
  if (value === null) return true
  if (value === undefined) return false
  if (typeof value === 'string') return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0

  return true
}

const toBranchPath = (path: string): (string | number)[] => path.split('.').filter(Boolean)

const pathKey = (path: (string | number)[]): string => JSON.stringify(path)

const matchesBranch = (value: unknown, branch: TFormSchemaOneOfBranch): boolean => {
  const matchEntries = Object.entries(branch.match || {})

  if (matchEntries.length === 0) {
    return false
  }

  return matchEntries.every(([path, expectedValue]) => get(value, path) === expectedValue)
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

  const matchedBranches = node.oneOfBranches.filter(branch => matchesBranch(value, branch))

  if (matchedBranches.length !== 1) {
    return []
  }

  const [activeBranch] = matchedBranches
  const visibleBranchPathKeys = new Set([
    ...Object.keys(activeBranch.match || {}).map(matchPath => pathKey(toBranchPath(matchPath))),
    ...(activeBranch.required || []).map(requiredPath => pathKey(toBranchPath(requiredPath))),
  ])
  const candidateHiddenPathKeys = new Set<string>()
  const candidateHiddenPaths: (string | number)[][] = []
  const addCandidatePath = (branchPath: string) => {
    const normalizedPath = toBranchPath(branchPath)
    const key = pathKey(normalizedPath)

    if (visibleBranchPathKeys.has(key) || candidateHiddenPathKeys.has(key)) {
      return
    }

    candidateHiddenPathKeys.add(key)
    candidateHiddenPaths.push(normalizedPath)
  }

  ;(activeBranch.forbidden || []).forEach(addCandidatePath)
  node.oneOfBranches
    .filter(branch => branch !== activeBranch)
    .forEach(branch => {
      ;(branch.required || []).forEach(addCandidatePath)
      ;(branch.forbidden || []).forEach(addCandidatePath)
    })

  return candidateHiddenPaths
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
