import { isMultilineString, isMultilineFromYaml } from './isMultilineString'

describe('isMultilineString', () => {
  it('should return false for empty string', () => {
    expect(isMultilineString('')).toBe(false)
  })

  it('should return false for null or undefined', () => {
    expect(isMultilineString(null as any)).toBe(false)
    expect(isMultilineString(undefined as any)).toBe(false)
  })

  it('should return true for strings with newlines', () => {
    expect(isMultilineString('line1\nline2')).toBe(true)
    expect(isMultilineString('line1\r\nline2')).toBe(true)
  })

  it('should return true for long strings', () => {
    const longString = 'a'.repeat(81)
    expect(isMultilineString(longString)).toBe(true)
  })

  it('should return true for strings with multiline indicators', () => {
    expect(isMultilineString('#cloud-config\npassword: atomic')).toBe(true)
    expect(isMultilineString('#!/bin/bash\necho "hello"')).toBe(true)
    expect(isMultilineString('-----BEGIN CERTIFICATE-----')).toBe(true)
    expect(isMultilineString('-----END CERTIFICATE-----')).toBe(true)
  })

  it('should return false for short single-line strings', () => {
    expect(isMultilineString('hello')).toBe(false)
    expect(isMultilineString('short string')).toBe(false)
  })
})

describe('isMultilineFromYaml', () => {
  it('should return false for empty content', () => {
    expect(isMultilineFromYaml('', ['field'])).toBe(false)
  })

  it('should return true for YAML with literal block scalar', () => {
    const yamlContent = `field: |
  #cloud-config
  password: atomic
  chpasswd: { expire: False }`
    expect(isMultilineFromYaml(yamlContent, ['field'])).toBe(true)
  })

  it('should return true for YAML with folded block scalar', () => {
    const yamlContent = `field: >
  This is a long string
  that should be folded`
    expect(isMultilineFromYaml(yamlContent, ['field'])).toBe(true)
  })

  it('should return false for YAML with regular string', () => {
    const yamlContent = `field: "regular string"`
    expect(isMultilineFromYaml(yamlContent, ['field'])).toBe(false)
  })
})
