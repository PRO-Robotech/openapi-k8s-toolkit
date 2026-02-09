export const isValidLabelSelectorObject = (input: unknown): input is Record<string, string | number> => {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    return false
  }

  const entries = Object.entries(input)
  if (entries.length === 0) return false

  return entries.every(([, value]) => typeof value === 'string' || typeof value === 'number')
}
