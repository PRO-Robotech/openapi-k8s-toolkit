import {
  extractBooleanDefault,
  extractListInputDefault,
  extractNumberDefault,
  extractStringDefault,
} from './extractDefaultValue'

describe('extractStringDefault', () => {
  it('returns the value when it is a string', () => {
    expect(extractStringDefault('TCP')).toBe('TCP')
    expect(extractStringDefault('')).toBe('')
  })

  it('returns undefined for non-string values', () => {
    expect(extractStringDefault(42)).toBeUndefined()
    expect(extractStringDefault(true)).toBeUndefined()
    expect(extractStringDefault(null)).toBeUndefined()
    expect(extractStringDefault(undefined)).toBeUndefined()
    expect(extractStringDefault({})).toBeUndefined()
    expect(extractStringDefault([])).toBeUndefined()
  })
})

describe('extractNumberDefault', () => {
  it('returns the value when it is a number', () => {
    expect(extractNumberDefault(0)).toBe(0)
    expect(extractNumberDefault(42)).toBe(42)
    expect(extractNumberDefault(-1)).toBe(-1)
    expect(extractNumberDefault(3.14)).toBe(3.14)
  })

  it('returns undefined for non-number values', () => {
    expect(extractNumberDefault('42')).toBeUndefined()
    expect(extractNumberDefault(true)).toBeUndefined()
    expect(extractNumberDefault(null)).toBeUndefined()
    expect(extractNumberDefault(undefined)).toBeUndefined()
    expect(extractNumberDefault({})).toBeUndefined()
  })
})

describe('extractBooleanDefault', () => {
  it('returns the value when it is a boolean', () => {
    expect(extractBooleanDefault(true)).toBe(true)
    expect(extractBooleanDefault(false)).toBe(false)
  })

  it('returns undefined for non-boolean values', () => {
    expect(extractBooleanDefault('true')).toBeUndefined()
    expect(extractBooleanDefault(1)).toBeUndefined()
    expect(extractBooleanDefault(0)).toBeUndefined()
    expect(extractBooleanDefault(null)).toBeUndefined()
    expect(extractBooleanDefault(undefined)).toBeUndefined()
  })
})

describe('extractListInputDefault', () => {
  it('returns the value when it is a string', () => {
    expect(extractListInputDefault('foo')).toBe('foo')
  })

  it('returns the value when it is an array of strings', () => {
    expect(extractListInputDefault(['foo', 'bar'])).toEqual(['foo', 'bar'])
    expect(extractListInputDefault([])).toEqual([])
  })

  it('returns undefined when the array contains non-string items', () => {
    expect(extractListInputDefault(['foo', 1])).toBeUndefined()
    expect(extractListInputDefault([null])).toBeUndefined()
    expect(extractListInputDefault([true])).toBeUndefined()
  })

  it('returns undefined for other types', () => {
    expect(extractListInputDefault(42)).toBeUndefined()
    expect(extractListInputDefault(true)).toBeUndefined()
    expect(extractListInputDefault(null)).toBeUndefined()
    expect(extractListInputDefault(undefined)).toBeUndefined()
    expect(extractListInputDefault({})).toBeUndefined()
  })
})
