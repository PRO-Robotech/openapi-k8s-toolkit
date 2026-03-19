/** Extract a 3-digit HTTP status code from a trailing "(NNN)" in a string. */
const extractStatusFromString = (msg: string): number | undefined => {
  const match = msg.match(/\((\d{3})\)\s*$/)
  if (!match) return undefined
  const code = Number(match[1])
  return code >= 100 && code <= 599 ? code : undefined
}

/**
 * Extract an HTTP status code from any error shape:
 * - AxiosError: `.response.status`
 * - Error / string with "(NNN)" suffix: regex parse
 */
export const extractHttpStatus = (error: unknown): number | undefined => {
  if (typeof error === 'string') return extractStatusFromString(error)
  if (error instanceof Error) {
    const { response } = error as { response?: { status?: unknown } }
    if (typeof response?.status === 'number') return response.status
    return extractStatusFromString(error.message)
  }
  return undefined
}

/** Extract a human-readable message from any error shape. */
export const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (error instanceof Error) {
    const { response } = error as { response?: { statusText?: string } }
    if (response?.statusText) return response.statusText
    return error.message
  }
  return String(error)
}

/** Resolve a dot-separated path (e.g. ".items" or ".data.results") on an object. */
export const getValueByPath = (obj: Record<string, unknown>, path: string): unknown =>
  path
    .replace(/^\./, '')
    .split('.')
    .reduce<unknown>((current, key) => {
      if (current == null || typeof current !== 'object') return undefined
      return (current as Record<string, unknown>)[key]
    }, obj)

/** Check whether the response for a given reqIndex has an empty array at the specified path. */
export const isEmptyAtPath = (multiQueryData: Record<string, unknown>, reqIndex: number, path: string): boolean => {
  const reqData = multiQueryData[`req${reqIndex}`]
  if (reqData == null || typeof reqData !== 'object') return false
  const value = getValueByPath(reqData as Record<string, unknown>, path)
  return Array.isArray(value) && value.length === 0
}
