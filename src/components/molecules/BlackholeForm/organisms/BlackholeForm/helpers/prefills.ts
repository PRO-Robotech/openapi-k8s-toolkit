/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash'
import { dbg } from './debugs'

export const pathKey = (p: (string | number)[]) => JSON.stringify(p)

// Replace any numeric segment in a path with '*' so
// ['spec','containers',0,'image'] → ['spec','containers','*','image']
export const toWildcardPath = (p: (string | number)[]) =>
  p.map(seg => (typeof seg === 'number' || (typeof seg === 'string' && /^\d+$/.test(seg)) ? '*' : seg))

export type TWildcardTemplate = {
  wildcardPath: (string | number)[]
}

export type TTemplate = TWildcardTemplate & {
  value: unknown
}

// Traverse obj and return a map of array-path-key → length
export const collectArrayLengths = (obj: unknown, base: (string | number)[] = [], out = new Map<string, number>()) => {
  if (Array.isArray(obj)) {
    out.set(pathKey(base), obj.length)
    obj.forEach((v, i) => collectArrayLengths(v, [...base, i], out))
  } else if (_.isPlainObject(obj)) {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => collectArrayLengths(v, [...base, k], out))
  }
  return out
}

// template wildcard path may contain '*' before the growing array;
// treat '*' as "match anything" for the prefix.

export const templateMatchesArray = (tpl: TWildcardTemplate, arrayPath: (string | number)[]) => {
  const w = tpl.wildcardPath
  if (w.length < arrayPath.length + 1) {
    dbg('⛔ length too short to match', { w, arrayPath })
    return false
  }
  for (let i = 0; i < arrayPath.length; i++) {
    if (w[i] !== '*' && w[i] !== arrayPath[i]) {
      dbg('⛔ segment mismatch', { index: i, wSeg: w[i], arraySeg: arrayPath[i], w, arrayPath })
      return false
    }
  }
  const ok = w[arrayPath.length] === '*'
  if (!ok) dbg('⛔ wildcard not at item position', { expectedIndex: arrayPath.length, w })
  return ok
}

export const buildConcretePathForNewItem = (
  tpl: TWildcardTemplate,
  arrayPath: (string | number)[],
  newIndex: number,
) => {
  const w = tpl.wildcardPath
  const realizedPrefix: (string | number)[] = []
  for (let i = 0; i < arrayPath.length; i++) {
    realizedPrefix.push(w[i] === '*' ? arrayPath[i] : w[i])
  }
  const result = [...realizedPrefix, newIndex, ...w.slice(arrayPath.length + 1)]
  dbg('→ concrete path', { wildcard: w, arrayPath, newIndex, realizedPrefix, result })
  return result
}

export const getConcretePathsForNewArrayItem = (
  templates: TWildcardTemplate[],
  arrayPath: (string | number)[],
  newIndex: number,
) =>
  templates
    .filter(tpl => templateMatchesArray(tpl, arrayPath))
    .map(tpl => buildConcretePathForNewItem(tpl, arrayPath, newIndex))

// defensively remove literal "*" object keys before syncing/submit
// Keeps your input type (object, array, whatever) without "unknown" noise
export const scrubLiteralWildcardKeys = <T>(input: T): T => {
  if (Array.isArray(input)) return input.map(scrubLiteralWildcardKeys) as T
  if (_.isPlainObject(input)) {
    const out: Record<string, unknown> = {}
    Object.entries(input as Record<string, unknown>).forEach(([k, v]) => {
      if (k === '*') return
      out[k] = scrubLiteralWildcardKeys(v)
    })
    return out as T
  }
  return input
}
