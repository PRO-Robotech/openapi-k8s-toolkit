/* eslint-disable @typescript-eslint/no-explicit-any */
import { TTaintLike } from './types'

const flattenOnce = (arr: unknown[][]): unknown[] => arr.reduce<unknown[]>((acc, row) => [...acc, ...row], [])

const ALLOWED_EFFECTS: ReadonlySet<string> = new Set(['NoSchedule', 'PreferNoSchedule', 'NoExecute'])

export const isTaintLike = (x: unknown): x is TTaintLike => {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false

  const o = x as Record<string, unknown>
  // effect is required and must be one of the allowed literals
  if (typeof o.effect !== 'string' || !ALLOWED_EFFECTS.has(o.effect)) return false

  // key/value are optional, but if present they must be strings
  if ('key' in o && typeof o.key !== 'string') return false
  if ('value' in o && typeof o.value !== 'string') return false

  return true
}

/** Filters any unknown value to an array of valid {key?, value?, effect} objects */
export const filterTaintLikes = (input: unknown): TTaintLike[] => {
  if (!Array.isArray(input)) return []
  return input.filter(isTaintLike)
}

export const getTaintsItemsInside = (value: any[]): { counter?: number; taints?: TTaintLike[]; error?: string } => {
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

  return { counter: flattenArrayOfUnknown.length, taints: filterTaintLikes(flattenArrayOfUnknown) }
}
