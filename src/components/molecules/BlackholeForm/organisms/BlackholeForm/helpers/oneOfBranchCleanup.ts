import get from 'lodash/get'
import has from 'lodash/has'
import { TFormSchemaNode, TFormSchemaOneOfBranch, TFormSchemaProperties } from 'localTypes/formSchema'
import {
  collectInactiveOneOfBranchPaths,
  collectOneOfBranchMatchKeys,
  matchesOneOfBranch,
  toOneOfBranchPath,
} from '../../../molecules/helpers/oneOfBranch'

const isAnyMatchKeyChangedAtNode = ({
  branches,
  nodePath,
  changedValues,
}: {
  branches: TFormSchemaOneOfBranch[]
  nodePath: (string | number)[]
  changedValues: Record<string, unknown>
}): boolean => {
  return collectOneOfBranchMatchKeys(branches).some(matchKey => {
    const fullPath = [...nodePath, ...toOneOfBranchPath(matchKey)]
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

  const matchedBranches = node.oneOfBranches.filter(branch => matchesOneOfBranch(value, branch))

  if (matchedBranches.length !== 1) {
    return []
  }

  const [activeBranch] = matchedBranches
  return collectInactiveOneOfBranchPaths({ branches: node.oneOfBranches, activeBranch }).map(branchPath => [
    ...path,
    ...branchPath,
  ])
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
