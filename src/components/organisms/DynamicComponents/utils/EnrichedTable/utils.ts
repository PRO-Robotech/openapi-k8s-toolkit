export const serializeLabels = (input: unknown): string => {
  // 1. Must be a non-null plain object
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    return 'Expected a plain object'
  }

  const entries = Object.entries(input)

  // 2. Validate all values are string|number
  if (!entries.map(([, v]) => v).every(v => typeof v === 'string' || typeof v === 'number')) {
    return 'All values must be string or number'
  }

  // 3+4. Build "k=v" pairs, join with commas, then URL‑encode
  return encodeURIComponent(entries.map(([k, v]) => `${k}=${v}`).join(','))
}

export const serializeLabelsWithNoEncoding = (input: unknown): string => {
  // 1. Must be a non-null plain object
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    return 'Expected a plain object'
  }

  const entries = Object.entries(input)

  // 2. Validate all values are string|number
  if (!entries.map(([, v]) => v).every(v => typeof v === 'string' || typeof v === 'number')) {
    return 'All values must be string or number'
  }

  // 3+4. Build "k=v" pairs, join with commas
  return entries.map(([k, v]) => `${k}=${v}`).join(',')
}
