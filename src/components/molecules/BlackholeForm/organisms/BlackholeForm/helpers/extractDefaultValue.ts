export const extractStringDefault = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined
}

export const extractNumberDefault = (value: unknown): number | undefined => {
  return typeof value === 'number' ? value : undefined
}

export const extractBooleanDefault = (value: unknown): boolean | undefined => {
  return typeof value === 'boolean' ? value : undefined
}

export const extractListInputDefault = (value: unknown): string | string[] | undefined => {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
    return value
  }

  return undefined
}
