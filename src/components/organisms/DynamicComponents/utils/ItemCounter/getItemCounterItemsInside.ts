/* eslint-disable @typescript-eslint/no-explicit-any */

const flattenOnce = (arr: unknown[][]): unknown[] => arr.reduce<unknown[]>((acc, row) => [...acc, ...row], [])

export const getItemCounterItemsInside = (value: any[]): { counter?: number; error?: string } => {
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

  return { counter: flattenArrayOfUnknown.length }
}
