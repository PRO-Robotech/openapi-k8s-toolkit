/**
 * Helpers for extracting OpenAPI schema `default` values and narrowing them
 * to the concrete primitive types each form field component expects.
 *
 * The `default` field in OpenAPI v2 is typed as `any`, so we must runtime-check
 * it before passing it into typed component props.
 *
 * In real Kubernetes OpenAPI schemas, defaults are always primitives (string,
 * number, boolean). Object/array defaults are not observed in practice — and
 * they would not make sense for form fields anyway, since objects/arrays are
 * rendered as collapsible containers, not as single inputs.
 */

export const extractStringDefault = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined
}

export const extractNumberDefault = (value: unknown): number | undefined => {
  return typeof value === 'number' ? value : undefined
}

export const extractBooleanDefault = (value: unknown): boolean | undefined => {
  return typeof value === 'boolean' ? value : undefined
}

export const extractStringOrNumberDefault = (value: unknown): string | number | undefined => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }
  return undefined
}

/**
 * For `listInput` fields, the form value can be either a single string (select
 * mode) or an array of strings (multi-select / tags mode). We accept both shapes
 * from the schema default and reject anything else.
 */
export const extractListInputDefault = (value: unknown): string | string[] | undefined => {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
    return value
  }
  return undefined
}
