import { buildPlaceholder, formatDefaultValue } from './buildPlaceholder'

describe('buildPlaceholder', () => {
  describe('formatDefaultValue', () => {
    it('formats array defaults consistently', () => {
      expect(formatDefaultValue(['TCP', 'UDP'])).toBe('TCP, UDP')
    })

    it('formats scalar defaults consistently', () => {
      expect(formatDefaultValue(0)).toBe('0')
      expect(formatDefaultValue(false)).toBe('false')
      expect(formatDefaultValue('')).toBe('')
    })
  })

  it('returns the field name when no defaultValue is provided', () => {
    expect(buildPlaceholder('protocol')).toBe('protocol')
    expect(buildPlaceholder(['spec', 'protocol'])).toBe('protocol')
  })

  it('returns the field name when defaultValue is undefined', () => {
    expect(buildPlaceholder('protocol', undefined)).toBe('protocol')
  })

  it('formats a string default', () => {
    expect(buildPlaceholder('protocol', 'TCP')).toBe('Default: TCP')
  })

  it('formats a number default', () => {
    expect(buildPlaceholder('replicas', 1)).toBe('Default: 1')
    expect(buildPlaceholder('minReadySeconds', 0)).toBe('Default: 0')
  })

  it('formats a boolean default', () => {
    expect(buildPlaceholder('enabled', true)).toBe('Default: true')
    expect(buildPlaceholder('disabled', false)).toBe('Default: false')
  })

  it('formats an empty-string default', () => {
    expect(buildPlaceholder('label', '')).toBe('Default: ')
  })

  it('formats an array default', () => {
    expect(buildPlaceholder('protocols', ['TCP', 'UDP'])).toBe('Default: TCP, UDP')
  })

  it('uses the last segment of an array name as the fallback', () => {
    expect(buildPlaceholder(['spec', 'template', 'name'])).toBe('name')
  })
})
