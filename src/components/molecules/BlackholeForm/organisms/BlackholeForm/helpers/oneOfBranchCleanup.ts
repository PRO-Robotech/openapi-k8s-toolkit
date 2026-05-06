import get from 'lodash/get'
import has from 'lodash/has'
import { TFormSchemaNode, TFormSchemaOneOfBranch, TFormSchemaProperties } from 'localTypes/formSchema'

const toBranchPath = (path: string): (string | number)[] => path.split('.').filter(Boolean)

const pathKey = (path: (string | number)[]): string => JSON.stringify(path)

const matchesBranch = (value: unknown, branch: TFormSchemaOneOfBranch): boolean => {
  const matchEntries = Object.entries(branch.match || {})

  if (matchEntries.length === 0) {
    return false
  }

  return matchEntries.every(([path, expectedValue]) => get(value, path) === expectedValue)
}

const collectMatchKeys = (branches: TFormSchemaOneOfBranch[]): string[] => {
  const set = new Set<string>()
  branches.forEach(branch => {
    Object.keys(branch.match || {}).forEach(key => {
      set.add(key)
    })
  })
  return Array.from(set)
}

const isAnyMatchKeyChangedAtNode = ({
  branches,
  nodePath,
  changedValues,
}: {
  branches: TFormSchemaOneOfBranch[]
  nodePath: (string | number)[]
  changedValues: Record<string, unknown>
}): boolean => {
  return collectMatchKeys(branches).some(matchKey => {
    const fullPath = [...nodePath, ...toBranchPath(matchKey)]
    return has(changedValues, fullPath)
  })
}

const getCurrentNodeCleanupPaths = ({
  node,
  value,
  path,
  changedValues,
}: {
  node: TFormSchemaNode
  value: unknown
  path: (string | number)[]
  changedValues: Record<string, unknown>
}): (string | number)[][] => {
  if (!node.oneOfBranches || node.oneOfBranches.length === 0) {
    return []
  }

  if (
    !isAnyMatchKeyChangedAtNode({
      branches: node.oneOfBranches,
      nodePath: path,
      changedValues,
    })
  ) {
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
  const candidateCleanupPathKeys = new Set<string>()
  const candidateCleanupPaths: (string | number)[][] = []
  const addCandidatePath = (branchPath: string) => {
    const normalizedPath = toBranchPath(branchPath)
    const key = pathKey(normalizedPath)

    if (visibleBranchPathKeys.has(key) || candidateCleanupPathKeys.has(key)) {
      return
    }

    candidateCleanupPathKeys.add(key)
    candidateCleanupPaths.push(normalizedPath)
  }

  ;(activeBranch.forbidden || []).forEach(addCandidatePath)
  node.oneOfBranches
    .filter(branch => branch !== activeBranch)
    .forEach(branch => {
      ;(branch.required || []).forEach(addCandidatePath)
      ;(branch.forbidden || []).forEach(addCandidatePath)
    })

  return candidateCleanupPaths.map(branchPath => [...path, ...branchPath])
}

export const collectInactiveBranchCleanupPaths = ({
  properties,
  values,
  changedValues,
  currentPath = [],
}: {
  properties: TFormSchemaProperties
  values: Record<string, unknown>
  changedValues: Record<string, unknown> | undefined
  currentPath?: (string | number)[]
}): (string | number)[][] => {
  if (!changedValues) {
    return []
  }

  return Object.entries(properties).flatMap(([key, node]) => {
    const path = [...currentPath, key]
    const value = get(values, path)
    const currentCleanupPaths = getCurrentNodeCleanupPaths({
      node,
      value,
      path,
      changedValues,
    })

    const nestedObjectCleanupPaths = node.properties
      ? collectInactiveBranchCleanupPaths({
          properties: node.properties,
          values,
          changedValues,
          currentPath: path,
        })
      : []

    const nestedArrayCleanupPaths =
      node.type === 'array' && node.items && Array.isArray(value)
        ? value.flatMap((_, index) => {
            const itemPath = [...path, index]
            const itemValue = get(values, itemPath)
            const itemCleanupPaths = getCurrentNodeCleanupPaths({
              node: node.items as TFormSchemaNode,
              value: itemValue,
              path: itemPath,
              changedValues,
            })

            return [
              ...itemCleanupPaths,
              ...(node.items?.properties
                ? collectInactiveBranchCleanupPaths({
                    properties: node.items.properties,
                    values,
                    changedValues,
                    currentPath: itemPath,
                  })
                : []),
            ]
          })
        : []

    return [...currentCleanupPaths, ...nestedObjectCleanupPaths, ...nestedArrayCleanupPaths]
  })
}
