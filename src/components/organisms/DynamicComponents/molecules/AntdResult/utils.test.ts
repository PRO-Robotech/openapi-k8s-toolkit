import {
  getValueByPath,
  isEmptyAtPath,
  extractHttpStatus,
  extractErrorMessage,
  httpStatusToResultStatus,
  getDefaultTitle,
  resolveItemsPath,
  checkReqIndex,
  findWorstError,
  STATUS_SEVERITY,
} from './utils'

// ── getValueByPath ───────────────────────────────────────────

describe('getValueByPath', () => {
  it('resolves a single-level path', () => {
    expect(getValueByPath({ items: [1, 2] }, '.items')).toEqual([1, 2])
  })

  it('resolves a path without leading dot', () => {
    expect(getValueByPath({ items: [1] }, 'items')).toEqual([1])
  })

  it('resolves a deeply nested path', () => {
    const obj = { data: { results: { nested: 'value' } } }
    expect(getValueByPath(obj, '.data.results.nested')).toBe('value')
  })

  it('returns undefined for missing intermediate key', () => {
    expect(getValueByPath({ data: { other: 1 } }, '.data.results.nested')).toBeUndefined()
  })

  it('returns undefined when intermediate is null', () => {
    expect(getValueByPath({ data: null } as unknown as Record<string, unknown>, '.data.items')).toBeUndefined()
  })

  it('returns undefined when intermediate is a primitive', () => {
    expect(getValueByPath({ data: 42 } as unknown as Record<string, unknown>, '.data.items')).toBeUndefined()
  })

  it('returns undefined for empty object', () => {
    expect(getValueByPath({}, '.items')).toBeUndefined()
  })

  it('returns the value even if it is falsy (0, false, empty string)', () => {
    expect(getValueByPath({ count: 0 }, '.count')).toBe(0)
    expect(getValueByPath({ flag: false }, '.flag')).toBe(false)
    expect(getValueByPath({ name: '' }, '.name')).toBe('')
  })
})

// ── isEmptyAtPath ────────────────────────────────────────────

describe('isEmptyAtPath', () => {
  it('returns true when array at path is empty', () => {
    expect(isEmptyAtPath({ req0: { items: [] } }, 0, '.items')).toBe(true)
  })

  it('returns false when array at path has elements', () => {
    expect(isEmptyAtPath({ req0: { items: [{ name: 'a' }] } }, 0, '.items')).toBe(false)
  })

  it('returns false when value at path is not an array', () => {
    expect(isEmptyAtPath({ req0: { items: 'string' } }, 0, '.items')).toBe(false)
    expect(isEmptyAtPath({ req0: { items: {} } }, 0, '.items')).toBe(false)
    expect(isEmptyAtPath({ req0: { items: 42 } }, 0, '.items')).toBe(false)
  })

  it('returns false when reqData is null', () => {
    expect(isEmptyAtPath({ req0: null } as unknown as Record<string, unknown>, 0, '.items')).toBe(false)
  })

  it('returns false when reqData is undefined (missing key)', () => {
    expect(isEmptyAtPath({}, 0, '.items')).toBe(false)
  })

  it('returns false when reqData is a non-object primitive', () => {
    expect(isEmptyAtPath({ req0: 'string' }, 0, '.items')).toBe(false)
  })

  it('returns false when path does not exist in reqData', () => {
    expect(isEmptyAtPath({ req0: { metadata: {} } }, 0, '.items')).toBe(false)
  })

  it('works with custom paths', () => {
    expect(isEmptyAtPath({ req1: { data: { results: [] } } }, 1, '.data.results')).toBe(true)
    expect(isEmptyAtPath({ req1: { data: { results: [1] } } }, 1, '.data.results')).toBe(false)
  })

  it('uses the correct reqIndex', () => {
    const data = { req0: { items: [1] }, req1: { items: [] } }
    expect(isEmptyAtPath(data, 0, '.items')).toBe(false)
    expect(isEmptyAtPath(data, 1, '.items')).toBe(true)
  })
})

// ── extractHttpStatus ─────────────────────────────────────────

describe('extractHttpStatus', () => {
  it('extracts status from AxiosError shape (.response.status)', () => {
    const make = (status: number) => Object.assign(new Error('Request failed'), { response: { status } })
    expect(extractHttpStatus(make(403))).toBe(403)
    expect(extractHttpStatus(make(404))).toBe(404)
    expect(extractHttpStatus(make(500))).toBe(500)
  })

  it('extracts status from Error with "(NNN)" in message', () => {
    expect(extractHttpStatus(new Error('Access denied (403)'))).toBe(403)
    expect(extractHttpStatus(new Error('Initial list failed (404)'))).toBe(404)
    expect(extractHttpStatus(new Error('Server error (500)'))).toBe(500)
  })

  it('extracts status from plain string with "(NNN)" suffix', () => {
    expect(extractHttpStatus('Initial list failed (404)')).toBe(404)
    expect(extractHttpStatus('Access denied (403)')).toBe(403)
    expect(extractHttpStatus('Internal server error (500)')).toBe(500)
  })

  it('returns undefined for string without status code', () => {
    expect(extractHttpStatus('Something went wrong')).toBeUndefined()
    expect(extractHttpStatus('WebSocket closed')).toBeUndefined()
  })

  it('does not match mid-message parentheses (no false positive)', () => {
    expect(extractHttpStatus('Pod (nginx) crashed')).toBeUndefined()
    expect(extractHttpStatus('Deployment (v2) rollback')).toBeUndefined()
  })

  it('returns undefined for null, undefined, and numbers', () => {
    expect(extractHttpStatus(null)).toBeUndefined()
    expect(extractHttpStatus(undefined)).toBeUndefined()
    expect(extractHttpStatus(42)).toBeUndefined()
  })

  it('returns undefined for status codes outside 100-599', () => {
    expect(extractHttpStatus('error (000)')).toBeUndefined()
    expect(extractHttpStatus('error (600)')).toBeUndefined()
    expect(extractHttpStatus('error (999)')).toBeUndefined()
  })

  it('prefers .response.status over message parsing', () => {
    const err = Object.assign(new Error('error (500)'), { response: { status: 403 } })
    expect(extractHttpStatus(err)).toBe(403)
  })

  it('handles trailing whitespace after "(NNN)"', () => {
    expect(extractHttpStatus('Access denied (403) ')).toBe(403)
  })

  it('returns undefined for plain objects (not Error instances)', () => {
    expect(extractHttpStatus({ response: { status: 403 } })).toBeUndefined()
    expect(extractHttpStatus({ message: 'error (404)' })).toBeUndefined()
  })
})

// ── extractErrorMessage ───────────────────────────────────────

describe('extractErrorMessage', () => {
  it('returns a plain string as-is', () => {
    expect(extractErrorMessage('Initial list failed (404)')).toBe('Initial list failed (404)')
  })

  it('returns statusText from AxiosError', () => {
    const err = Object.assign(new Error('Request failed'), { response: { statusText: 'Forbidden' } })
    expect(extractErrorMessage(err)).toBe('Forbidden')
  })

  it('falls back to message when no statusText', () => {
    const errEmptyResp = Object.assign(new Error('Network error'), { response: {} })
    expect(extractErrorMessage(errEmptyResp)).toBe('Network error')
    expect(extractErrorMessage(new Error('Something broke'))).toBe('Something broke')
  })

  it('falls back to String(error) for non-Error values', () => {
    expect(extractErrorMessage(42)).toBe('42')
    expect(extractErrorMessage({ code: 500 })).toBe('[object Object]')
  })

  it('handles Error instances', () => {
    expect(extractErrorMessage(new Error('test error'))).toBe('test error')
  })

  it('handles null/undefined', () => {
    expect(extractErrorMessage(null)).toBe('null')
    expect(extractErrorMessage(undefined)).toBe('undefined')
  })
})

// ── httpStatusToResultStatus ─────────────────────────────────────

describe('httpStatusToResultStatus', () => {
  it('maps 403 → "403"', () => {
    expect(httpStatusToResultStatus(403)).toBe('403')
  })

  it('maps 404 → "404"', () => {
    expect(httpStatusToResultStatus(404)).toBe('404')
  })

  it('maps 500 → "500"', () => {
    expect(httpStatusToResultStatus(500)).toBe('500')
  })

  it('maps 502, 503 → "500" (any 5xx)', () => {
    expect(httpStatusToResultStatus(502)).toBe('500')
    expect(httpStatusToResultStatus(503)).toBe('500')
  })

  it('maps undefined → "error"', () => {
    expect(httpStatusToResultStatus(undefined)).toBe('error')
  })

  it('maps unrecognized status codes → "error"', () => {
    expect(httpStatusToResultStatus(400)).toBe('error')
    expect(httpStatusToResultStatus(401)).toBe('error')
    expect(httpStatusToResultStatus(200)).toBe('error')
  })
})

// ── getDefaultTitle ──────────────────────────────────────────────

describe('getDefaultTitle', () => {
  it('returns "Access Denied" for "403"', () => {
    expect(getDefaultTitle('403')).toBe('Access Denied')
  })

  it('returns "Not Found" for "404"', () => {
    expect(getDefaultTitle('404')).toBe('Not Found')
  })

  it('returns "Server Error" for "500"', () => {
    expect(getDefaultTitle('500')).toBe('Server Error')
  })

  it('returns "Error" for any other status', () => {
    expect(getDefaultTitle('error')).toBe('Error')
    expect(getDefaultTitle('info')).toBe('Error')
    expect(getDefaultTitle('warning')).toBe('Error')
  })
})

// ── resolveItemsPath ─────────────────────────────────────────────

describe('resolveItemsPath', () => {
  it('returns the string as-is when itemsPath is a string', () => {
    expect(resolveItemsPath('.data.results', 0)).toBe('.data.results')
    expect(resolveItemsPath('.data.results', 1)).toBe('.data.results')
  })

  it('returns ".items" when itemsPath is undefined', () => {
    expect(resolveItemsPath(undefined, 0)).toBe('.items')
    expect(resolveItemsPath(undefined, 2)).toBe('.items')
  })

  it('returns the element at the given index when itemsPath is an array', () => {
    const paths = ['.items', '.data.results', '.rows']
    expect(resolveItemsPath(paths, 0)).toBe('.items')
    expect(resolveItemsPath(paths, 1)).toBe('.data.results')
    expect(resolveItemsPath(paths, 2)).toBe('.rows')
  })

  it('falls back to ".items" when array index is out of bounds', () => {
    const paths = ['.items']
    expect(resolveItemsPath(paths, 1)).toBe('.items')
    expect(resolveItemsPath(paths, 5)).toBe('.items')
  })

  it('falls back to ".items" for an empty array', () => {
    expect(resolveItemsPath([], 0)).toBe('.items')
  })
})

// ── checkReqIndex ────────────────────────────────────────────────

describe('checkReqIndex', () => {
  const noError = () => null

  it('returns null when no error and data has items', () => {
    const data = { req0: { items: [{ name: 'nginx' }] } }
    expect(checkReqIndex(0, data, noError, true, '.items')).toBeNull()
  })

  it('returns null when no error and checkEmpty is false (even if items empty)', () => {
    const data = { req0: { items: [] } }
    expect(checkReqIndex(0, data, noError, false, '.items')).toBeNull()
  })

  it('returns 404 result when items is empty and checkEmpty is true', () => {
    const data = { req0: { items: [] } }
    const result = checkReqIndex(0, data, noError, true, '.items')

    expect(result).not.toBeNull()
    expect(result?.resultStatus).toBe('404')
    expect(result?.severity).toBe(STATUS_SEVERITY['404'])
    expect(result?.message).toBe('The requested resource was not found')
  })

  it('returns error result when getErrorForReq returns an error', () => {
    const error = Object.assign(new Error('Forbidden'), { response: { status: 403, statusText: 'Forbidden' } })
    const getError = (i: number) => (i === 0 ? error : null)

    const result = checkReqIndex(0, {}, getError, true, '.items')

    expect(result).not.toBeNull()
    expect(result?.resultStatus).toBe('403')
    expect(result?.severity).toBe(STATUS_SEVERITY['403'])
    expect(result?.message).toBe('Forbidden')
  })

  it('prioritizes HTTP error over empty check', () => {
    const error = Object.assign(new Error('Server Error'), { response: { status: 500 } })
    const getError = (i: number) => (i === 0 ? error : null)
    const data = { req0: { items: [] } }

    const result = checkReqIndex(0, data, getError, true, '.items')

    expect(result?.resultStatus).toBe('500')
  })

  it('uses custom itemsPath for empty detection', () => {
    const data = { req0: { data: { results: [] } } }
    const result = checkReqIndex(0, data, noError, true, '.data.results')

    expect(result?.resultStatus).toBe('404')
  })

  it('returns generic error for string error without status code', () => {
    const getError = (i: number) => (i === 0 ? 'WebSocket connection closed' : null)
    const result = checkReqIndex(0, {}, getError, true, '.items')

    expect(result?.resultStatus).toBe('error')
    expect(result?.message).toBe('WebSocket connection closed')
  })

  it('extracts status from string error with (NNN) suffix', () => {
    const getError = (i: number) => (i === 0 ? 'Initial list failed (404)' : null)
    const result = checkReqIndex(0, {}, getError, true, '.items')

    expect(result?.resultStatus).toBe('404')
    expect(result?.message).toBe('Initial list failed (404)')
  })
})

// ── findWorstError ───────────────────────────────────────────────

describe('findWorstError', () => {
  const noError = () => null

  it('returns null when all requests are OK', () => {
    const data = {
      req0: { items: [{ id: 1 }] },
      req1: { items: [{ id: 2 }] },
    }
    expect(findWorstError([0, 1], data, noError, true, '.items')).toBeNull()
  })

  it('returns null for an empty reqIndexes array', () => {
    expect(findWorstError([], {}, noError, true, '.items')).toBeNull()
  })

  it('returns the single error when only one request failed', () => {
    const error = Object.assign(new Error('Forbidden'), { response: { status: 403, statusText: 'Forbidden' } })
    const getError = (i: number) => (i === 1 ? error : null)
    const data = { req0: { items: [{ id: 1 }] } }

    const result = findWorstError([0, 1], data, getError, true, '.items')

    expect(result?.resultStatus).toBe('403')
    expect(result?.message).toBe('Forbidden')
  })

  it('picks 500 over 403 (highest severity wins)', () => {
    const err403 = Object.assign(new Error('Forbidden'), { response: { status: 403, statusText: 'Forbidden' } })
    const err500 = Object.assign(new Error('Internal Server Error'), { response: { status: 500 } })
    const getError = (i: number) => {
      if (i === 0) return err403
      if (i === 1) return err500
      return null
    }

    const result = findWorstError([0, 1], {}, getError, true, '.items')

    expect(result?.resultStatus).toBe('500')
  })

  it('picks 403 over 404 (empty list)', () => {
    const err403 = Object.assign(new Error('Forbidden'), { response: { status: 403, statusText: 'Forbidden' } })
    const getError = (i: number) => (i === 1 ? err403 : null)
    const data = { req0: { items: [] } }

    const result = findWorstError([0, 1], data, getError, true, '.items')

    expect(result?.resultStatus).toBe('403')
    expect(result?.message).toBe('Forbidden')
  })

  it('picks 500 over 404 (empty list)', () => {
    const err500 = Object.assign(new Error('Server Error'), { response: { status: 500 } })
    const getError = (i: number) => (i === 1 ? err500 : null)
    const data = { req0: { items: [] } }

    const result = findWorstError([0, 1], data, getError, true, '.items')

    expect(result?.resultStatus).toBe('500')
  })

  it('returns 404 (empty) when that is the only issue', () => {
    const data = { req0: { items: [{ id: 1 }] }, req1: { items: [] } }

    const result = findWorstError([0, 1], data, noError, true, '.items')

    expect(result?.resultStatus).toBe('404')
    expect(result?.message).toBe('The requested resource was not found')
  })

  it('ignores requests not in the reqIndexes array', () => {
    const error = Object.assign(new Error('Not Found'), { response: { status: 404 } })
    const getError = (i: number) => (i === 1 ? error : null)
    const data = { req0: { items: [{ id: 1 }] } }

    const result = findWorstError([0], data, getError, true, '.items')

    expect(result).toBeNull()
  })

  it('returns result with at least resultStatus and message', () => {
    const error = Object.assign(new Error('Forbidden'), { response: { status: 403 } })
    const getError = (i: number) => (i === 0 ? error : null)

    const result = findWorstError([0], {}, getError, true, '.items')

    expect(result).toMatchObject({ resultStatus: '403', message: 'Forbidden' })
  })

  it('uses per-request itemsPath when given an array', () => {
    const data = {
      req0: { items: [] }, // empty at .items
      req1: { data: { results: [{ id: 1 }] } }, // has data at .data.results
    }

    // With a single path ".items", req1 would also be checked at ".items" (missing → no empty detection)
    // With per-request paths, req0 checks ".items" (empty → 404), req1 checks ".data.results" (has data → OK)
    const result = findWorstError([0, 1], data, () => null, true, ['.items', '.data.results'])

    expect(result?.resultStatus).toBe('404')
    expect(result?.message).toBe('The requested resource was not found')
  })

  it('detects empty at different paths per request', () => {
    const data = {
      req0: { items: [{ id: 1 }] }, // has data at .items
      req1: { data: { results: [] } }, // empty at .data.results
    }

    const result = findWorstError([0, 1], data, () => null, true, ['.items', '.data.results'])

    expect(result?.resultStatus).toBe('404')
  })

  it('returns null when all requests have data at their respective paths', () => {
    const data = {
      req0: { items: [{ id: 1 }] },
      req1: { data: { results: [{ id: 2 }] } },
    }

    const result = findWorstError([0, 1], data, () => null, true, ['.items', '.data.results'])

    expect(result).toBeNull()
  })

  it('falls back to ".items" for missing array positions', () => {
    const data = {
      req0: { items: [] }, // empty at .items
      req1: { items: [{ id: 1 }] }, // has data at .items (fallback)
    }

    // Only one path provided — req1 falls back to default ".items"
    const result = findWorstError([0, 1], data, () => null, true, ['.items'])

    expect(result?.resultStatus).toBe('404')
  })

  it('accepts undefined itemsPath (defaults to ".items" for all)', () => {
    const data = { req0: { items: [] } }

    const result = findWorstError([0], data, () => null, true, undefined)

    expect(result?.resultStatus).toBe('404')
  })
})
