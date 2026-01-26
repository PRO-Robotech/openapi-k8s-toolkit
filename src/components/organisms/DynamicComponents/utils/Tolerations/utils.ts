/* eslint-disable @typescript-eslint/no-explicit-any */
import { TToleration } from './types'

const flattenOnce = (arr: unknown[][]): unknown[] => arr.reduce<unknown[]>((acc, row) => [...acc, ...row], [])

const ALLOWED_OPERATORS: ReadonlySet<string> = new Set(['Exists', 'Equal'])
const ALLOWED_EFFECTS: ReadonlySet<string> = new Set(['NoSchedule', 'PreferNoSchedule', 'NoExecute'])

export const isToleration = (x: unknown): x is TToleration => {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false
  const o = x as Record<string, unknown>

  if ('key' in o && typeof o.key !== 'string') return false
  if ('value' in o && typeof o.value !== 'string') return false

  if ('operator' in o) {
    if (typeof o.operator !== 'string' || !ALLOWED_OPERATORS.has(o.operator)) {
      return false
    }
  }

  if ('effect' in o) {
    if (typeof o.effect !== 'string' || !ALLOWED_EFFECTS.has(o.effect)) {
      return false
    }
  }

  // if ('tolerationSeconds' in o && typeof o.tolerationSeconds !== 'number') {
  //   return false
  // }

  return true
}

export const filterTolerations = (input: unknown): TToleration[] => {
  if (!Array.isArray(input)) return []
  return input.filter(isToleration)
}

export const getTolerationsItemsInside = (
  value: any[],
): { counter?: number; tolerations?: TToleration[]; error?: string } => {
  if (!Array.isArray(value)) {
    return { error: 'Value on jsonPath is not an array' }
  }

  let flattenArrayOfUnknown: unknown[] = []
  try {
    flattenArrayOfUnknown = flattenOnce(value)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
    return { error: 'Error while flattening' }
  }

  return { counter: flattenArrayOfUnknown.length, tolerations: filterTolerations(flattenArrayOfUnknown) }
}
