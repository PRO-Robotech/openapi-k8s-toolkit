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

// ── Error severity & status mapping ─────────────────────────────

export type TResultStatus = '403' | '404' | '500' | 'error'

export const STATUS_SEVERITY: Record<string, number> = {
  '500': 3,
  '403': 2,
  '404': 1,
  error: 0,
}

export const httpStatusToResultStatus = (statusCode: number | undefined): TResultStatus => {
  if (statusCode === 403) return '403'
  if (statusCode === 404) return '404'
  if (statusCode && statusCode >= 500) return '500'
  return 'error'
}

export const getDefaultTitle = (status: string | number): string => {
  if (status === '403') return 'Access Denied'
  if (status === '404') return 'Not Found'
  if (status === '500') return 'Server Error'
  return 'Error'
}

// ── Per-request path resolution ─────────────────────────────────

/** Resolve the itemsPath for a specific position in the reqIndex array.
 *  - string → same path for all requests
 *  - string[] → positional mapping (itemsPath[index] for reqIndex at that position)
 *  - undefined → default ".items" */
export const resolveItemsPath = (itemsPath: string | string[] | undefined, index: number): string => {
  if (Array.isArray(itemsPath)) return itemsPath[index] ?? '.items'
  return itemsPath ?? '.items'
}

// ── Per-request error checking ──────────────────────────────────

/** Check a single reqIndex for errors/empty state. Returns null if OK. */
export const checkReqIndex = (
  reqIndex: number,
  multiQueryData: Record<string, unknown>,
  getErrorForReq: (i: number) => unknown,
  shouldCheckEmpty: boolean,
  itemsPath: string,
): { resultStatus: TResultStatus; severity: number; message: string } | null => {
  const error = getErrorForReq(reqIndex)
  const emptyListDetected = !error && shouldCheckEmpty && isEmptyAtPath(multiQueryData, reqIndex, itemsPath)

  if (!error && !emptyListDetected) return null

  const httpStatus = emptyListDetected ? 404 : extractHttpStatus(error)
  const resultStatus = httpStatusToResultStatus(httpStatus)
  const severity = STATUS_SEVERITY[resultStatus] ?? 0
  const message = emptyListDetected ? 'The requested resource was not found' : extractErrorMessage(error)

  return { resultStatus, severity, message }
}

/** Find the worst error across an array of reqIndexes. Returns null if all OK.
 *  itemsPath can be a string (same for all) or string[] (per-position). */
export const findWorstError = (
  reqIndexes: number[],
  multiQueryData: Record<string, unknown>,
  getErrorForReq: (i: number) => unknown,
  shouldCheckEmpty: boolean,
  itemsPath: string | string[] | undefined,
): { resultStatus: TResultStatus; message: string } | null =>
  reqIndexes.reduce<{ resultStatus: TResultStatus; message: string; severity: number } | null>(
    (worst, reqIndex, index) => {
      const resolved = resolveItemsPath(itemsPath, index)
      const result = checkReqIndex(reqIndex, multiQueryData, getErrorForReq, shouldCheckEmpty, resolved)
      if (!result) return worst
      if (!worst || result.severity > worst.severity) {
        return { resultStatus: result.resultStatus, message: result.message, severity: result.severity }
      }
      return worst
    },
    null,
  )
