import { getValueByPath, isEmptyAtPath, extractHttpStatus, extractErrorMessage } from './utils'

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
    expect(extractHttpStatus({ response: { status: 403 } })).toBe(403)
    expect(extractHttpStatus({ response: { status: 404 } })).toBe(404)
    expect(extractHttpStatus({ response: { status: 500 } })).toBe(500)
  })

  it('extracts status from Error with "(NNN)" in message', () => {
    expect(extractHttpStatus({ message: 'Access denied (403)' })).toBe(403)
    expect(extractHttpStatus({ message: 'Initial list failed (404)' })).toBe(404)
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
    expect(extractHttpStatus({ response: { status: 403 }, message: 'error (500)' })).toBe(403)
  })

  it('handles trailing whitespace after "(NNN)"', () => {
    expect(extractHttpStatus('Access denied (403) ')).toBe(403)
  })
})

// ── extractErrorMessage ───────────────────────────────────────

describe('extractErrorMessage', () => {
  it('returns a plain string as-is', () => {
    expect(extractErrorMessage('Initial list failed (404)')).toBe('Initial list failed (404)')
  })

  it('returns statusText from AxiosError', () => {
    expect(extractErrorMessage({ response: { statusText: 'Forbidden' }, message: 'Request failed' })).toBe('Forbidden')
  })

  it('falls back to message when no statusText', () => {
    expect(extractErrorMessage({ response: {}, message: 'Network error' })).toBe('Network error')
    expect(extractErrorMessage({ message: 'Something broke' })).toBe('Something broke')
  })

  it('falls back to String(error) when no message or statusText', () => {
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
