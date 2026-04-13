/* eslint-disable @typescript-eslint/no-explicit-any */

export const unknownToString = (value: unknown): string => {
  if (!value) {
    return 'No value'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return value.toString()
}

const flattenOnce = (arr: unknown[][]): unknown[] => arr.reduce<unknown[]>((acc, row) => [...acc, ...row], [])

/**
 * Type guard for “array of plain objects”:
 * Checks that `val` is an Array whose items are non-null objects (i.e. Record<string|number, unknown>).
 */
const isRecordArray = (val: unknown): val is Record<string | number, unknown>[] => {
  return (
    Array.isArray(val) &&
    val.every(
      (item): item is Record<string | number, unknown> =>
        item !== null &&
        typeof item === 'object' &&
        // exclude nested Arrays if you want “plain” objects only:
        !Array.isArray(item),
    )
  )
}

export const parseArrayOfAny = (value: any[]): { data?: Record<string, unknown>[]; error?: string } => {
  if (!Array.isArray(value)) {
    return { error: 'Value on jsonPath is not an array' }
  }

  let flattenArrayOfUnknown: unknown[] = []
  try {
    flattenArrayOfUnknown = flattenOnce(value)
  } catch {
    return { error: 'Error while flattening' }
  }

  if (isRecordArray(flattenArrayOfUnknown)) {
    return { data: flattenArrayOfUnknown }
  }

  return { error: 'Value on jsonPath is not a record array' }
}
