/* eslint-disable @typescript-eslint/no-explicit-any */
type TStringNumberRecord = Record<string, string>

const isObject = (x: unknown): x is object => typeof x === 'object' && x !== null

const isPlainObject = (x: unknown): x is Record<string, unknown> =>
  isObject(x) &&
  !Array.isArray(x) &&
  (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null)

const isString = (v: unknown): v is string => typeof v === 'string'

const isStringNumberRecord = (x: unknown): x is TStringNumberRecord =>
  isPlainObject(x) && Object.values(x).every(isString)

export const getAnnotationsItemsInside = (
  value: any[],
): { counter?: number; annotations?: TStringNumberRecord; error?: string } => {
  if (!Array.isArray(value)) {
    return { error: 'Value on jsonPath is not an array' }
  }

  if (typeof value[0] !== 'object' || value[0] === null) {
    return { counter: 0, annotations: isStringNumberRecord(value[0]) ? value[0] : undefined }
    // return { error: 'Value[0] is not an object' }
  }

  return { counter: Object.keys(value[0]).length, annotations: isStringNumberRecord(value[0]) ? value[0] : undefined }
}
