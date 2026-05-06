import get from 'lodash/get'
import { TFormSchemaOneOfBranch } from 'localTypes/formSchema'

export const toOneOfBranchPath = (path: string): (string | number)[] => path.split('.').filter(Boolean)

export const getOneOfBranchPathKey = (path: (string | number)[]): string => JSON.stringify(path)

export const matchesOneOfBranch = (value: unknown, branch: TFormSchemaOneOfBranch): boolean => {
  const matchEntries = Object.entries(branch.match || {})

  if (matchEntries.length === 0) {
    return false
  }

  return matchEntries.every(([path, expectedValue]) => get(value, path) === expectedValue)
}

export const collectOneOfBranchMatchKeys = (branches: TFormSchemaOneOfBranch[]): string[] => {
  const set = new Set<string>()
  branches.forEach(branch => {
    Object.keys(branch.match || {}).forEach(key => {
      set.add(key)
    })
  })
  return Array.from(set)
}

export const collectInactiveOneOfBranchPaths = ({
  branches,
  activeBranch,
}: {
  branches: TFormSchemaOneOfBranch[]
  activeBranch: TFormSchemaOneOfBranch
}): (string | number)[][] => {
  const visibleBranchPathKeys = new Set([
    ...Object.keys(activeBranch.match || {}).map(matchPath => getOneOfBranchPathKey(toOneOfBranchPath(matchPath))),
    ...(activeBranch.required || []).map(requiredPath => getOneOfBranchPathKey(toOneOfBranchPath(requiredPath))),
  ])
  const candidatePathKeys = new Set<string>()
  const candidatePaths: (string | number)[][] = []
  const addCandidatePath = (branchPath: string) => {
    const normalizedPath = toOneOfBranchPath(branchPath)
    const key = getOneOfBranchPathKey(normalizedPath)

    if (visibleBranchPathKeys.has(key) || candidatePathKeys.has(key)) {
      return
    }

    candidatePathKeys.add(key)
    candidatePaths.push(normalizedPath)
  }

  ;(activeBranch.forbidden || []).forEach(addCandidatePath)
  branches
    .filter(branch => branch !== activeBranch)
    .forEach(branch => {
      ;(branch.required || []).forEach(addCandidatePath)
      ;(branch.forbidden || []).forEach(addCandidatePath)
    })

  return candidatePaths
}
