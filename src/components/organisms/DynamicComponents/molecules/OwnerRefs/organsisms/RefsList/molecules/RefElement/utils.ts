/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-explicit-any */
import jp from 'jsonpath'
import { TOwnerReference } from '../../../../types'

type PathSeg = string | number

export const findOwnerReferencePath = (
  rawObject: any,
  jsonPathToArrayOfRefs: string,
  reference: TOwnerReference,
): PathSeg[] | undefined => {
  if (!rawObject || !jsonPathToArrayOfRefs) return undefined

  // normalise: ".spec.customRef" | "$.spec.customRef" | ".spec.customRef[*]" → "$.spec.customRef"
  let arrayJsonPath = jsonPathToArrayOfRefs.trim()

  if (arrayJsonPath.startsWith('.')) {
    arrayJsonPath = `$${arrayJsonPath}`
  }
  if (!arrayJsonPath.startsWith('$')) {
    arrayJsonPath = `$${arrayJsonPath}`
  }
  // we want the array node, not its elements
  arrayJsonPath = arrayJsonPath.replace(/\[\*\]$/, '')

  // this should give you exactly the node you logged:
  // { value: [ ...refs... ], path: ['$', 'spec', 'customRef'] }
  const nodes = jp.nodes(rawObject, arrayJsonPath)
  if (!nodes.length) return undefined

  const arrayNode = nodes[0]
  const arr = arrayNode.value

  if (!Array.isArray(arr)) return undefined

  // find index of our reference in that array
  const index = arr.findIndex(item => {
    if (!item) return false
    // be as strict/loose as you want here
    return item.name === reference.name && item.kind === reference.kind && item.apiVersion === reference.apiVersion
  })

  if (index === -1) return undefined

  // arrayNode.path is like ['$', 'spec', 'customRef']
  // drop '$' and append the index → ['spec', 'customRef', 1]
  const basePathSegs = arrayNode.path.slice(1) as PathSeg[]
  return [...basePathSegs, index]
}

// turn "spec.hosts.0.namespace" → ["spec","hosts",0,"namespace"]
const parseDotPath = (dotPath: string): PathSeg[] =>
  dotPath
    .split('.')
    .filter(Boolean)
    .map(seg => (seg.match(/^\d+$/) ? Number(seg) : seg))

export const resolveFormPath = (
  pathInput: string | string[] | undefined,
  basePathForRelative: PathSeg[],
): PathSeg[] => {
  if (!pathInput) return []

  // if it's already an array (from old usage), just return as-is
  if (Array.isArray(pathInput)) return pathInput

  const pathStr = String(pathInput)
  const isRelative = pathStr.startsWith('./') || pathStr.startsWith('../')

  if (!isRelative) {
    // absolute (dot notation)
    return parseDotPath(pathStr)
  }

  // relative: split by "/" then interpret each segment
  let resolved: PathSeg[] = [...basePathForRelative]
  const parts = pathStr.split('/').filter(Boolean) // e.g. ["..", "..", "foo"]

  for (const part of parts) {
    if (part === '.') {
      continue
    }
    if (part === '..') {
      resolved = resolved.slice(0, -1)
      continue
    }
    resolved.push(...parseDotPath(part))
  }

  return resolved
}
