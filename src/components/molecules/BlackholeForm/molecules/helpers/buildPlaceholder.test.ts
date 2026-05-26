import { buildPlaceholder, formatDefaultValue, getExampleTooltip } from './buildPlaceholder'

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
    expect(buildPlaceholder('label', '')).toBe('label')
  })

  it('uses the field name for an empty array default', () => {
    expect(buildPlaceholder('protocols', [])).toBe('protocols')
  })

  it('formats an array default', () => {
    expect(buildPlaceholder('protocols', ['TCP', 'UDP'])).toBe('Default: TCP, UDP')
  })

  it('uses the last segment of an array name as the fallback', () => {
    expect(buildPlaceholder(['spec', 'template', 'name'])).toBe('name')
  })

  describe('example priority', () => {
    it('returns Example placeholder when only example is provided', () => {
      expect(buildPlaceholder('image', undefined, 'registry.example.com/app:v1.2.3')).toBe(
        'Example: registry.example.com/app:v1.2.3',
      )
    })

    it('formats a numeric example', () => {
      expect(buildPlaceholder('replicas', undefined, 5)).toBe('Example: 5')
    })

    it('prefers default over example when both are provided', () => {
      expect(buildPlaceholder('image', 'nginx:latest', 'registry.example.com/app:v1.2.3')).toBe('Default: nginx:latest')
    })

    it('ignores example when default is an actionable falsy value', () => {
      expect(buildPlaceholder('count', 0, 42)).toBe('Default: 0')
      expect(buildPlaceholder('flag', false, true)).toBe('Default: false')
    })

    it('uses example when default is empty and non-actionable', () => {
      expect(buildPlaceholder('label', '', 'some-example')).toBe('Example: some-example')
      expect(buildPlaceholder('protocols', [], ['TCP'])).toBe('Example: TCP')
    })
  })
})

describe('getExampleTooltip', () => {
  it('returns undefined when example is not provided', () => {
    expect(getExampleTooltip('nginx:latest', undefined)).toBeUndefined()
    expect(getExampleTooltip(undefined, undefined)).toBeUndefined()
  })

  it('returns undefined when only example is provided (placeholder already shows it)', () => {
    expect(getExampleTooltip(undefined, 'registry.example.com/app:v1.2.3')).toBeUndefined()
  })

  it('returns the formatted example when both default and example are provided', () => {
    expect(getExampleTooltip('nginx:latest', 'registry.example.com/app:v1.2.3')).toBe(
      'Example: registry.example.com/app:v1.2.3',
    )
  })

  it('surfaces example tooltip when default is actionable but falsy', () => {
    expect(getExampleTooltip(0, 42)).toBe('Example: 42')
    expect(getExampleTooltip(false, true)).toBe('Example: true')
  })

  it('does not surface example tooltip when empty default lets placeholder show example', () => {
    expect(getExampleTooltip('', 'some-example')).toBeUndefined()
    expect(getExampleTooltip([], ['TCP'])).toBeUndefined()
  })

  it('formats array examples with comma separation', () => {
    expect(getExampleTooltip(['tcp'], ['TCP', 'UDP'])).toBe('Example: TCP, UDP')
  })
})
