/* eslint-disable @typescript-eslint/no-explicit-any */

export const getKeyCounterItemsInside = (value: any[]): { counter?: number; error?: string } => {
  if (!Array.isArray(value)) {
    return { error: 'Value on jsonPath is not an array' }
  }

  if (typeof value[0] !== 'object' || value[0] === null) {
    return { counter: 0 }
    // return { error: 'Value[0] is not an object' }
  }

  return { counter: Object.keys(value[0]).length }
}
