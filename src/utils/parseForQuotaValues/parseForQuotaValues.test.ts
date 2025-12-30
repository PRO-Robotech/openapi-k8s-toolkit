/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  floorToDecimal,
  parseQuotaValue,
  parseQuotaValueCpu,
  parseQuotaValueMemoryAndStorage,
} from './parseForQuotaValues'

describe('floorToDecimal', () => {
  test('floors to given decimal places', () => {
    expect(floorToDecimal(1.29, 1)).toBe(1.2)
    expect(floorToDecimal(1.01, 1)).toBe(1.0)
    expect(floorToDecimal(9.99, 0)).toBe(9)
  })

  test('handles negative numbers using Math.floor semantics', () => {
    // Math.floor(-12.1) = -13 → -1.3
    expect(floorToDecimal(-1.21, 1)).toBe(-1.3)
  })
})

describe('parseQuotaValue (generic)', () => {
  test('cpu: converts millicores and floors to 1 decimal', () => {
    expect(parseQuotaValue('cpu', '500m')).toBe(0.5)
    expect(parseQuotaValue('cpu', '1500m')).toBe(1.5)
    expect(parseQuotaValue('cpu', '1234m')).toBe(1.2)
  })

  test('cpu: plain number is treated as cores', () => {
    expect(parseQuotaValue('cpu', '2')).toBe(2.0)
    expect(parseQuotaValue('cpu', '0.09')).toBe(0.0)
  })

  test('non-cpu: metric suffixes', () => {
    expect(parseQuotaValue('memory', '500m')).toBe(0.5)
    expect(parseQuotaValue('memory', '500M')).toBe(0.5)
    expect(parseQuotaValue('memory', '2G')).toBe(2.0)
    expect(parseQuotaValue('memory', '2T')).toBe(2000.0)

    // "k" branch divides by 1,000,000
    expect(parseQuotaValue('memory', '500000k')).toBe(0.5)
  })

  test('non-cpu: binary-ish suffix branches Ki/Mi', () => {
    // Ki: /1024 then /1_000_000
    // 102,400,000 Ki -> 100,000 -> 0.1
    expect(parseQuotaValue('memory', '102400000Ki')).toBe(0.1)

    // Mi: /1,000 then /1,000
    expect(parseQuotaValue('memory', '100000Mi')).toBe(0.1)
  })

  test('non-cpu: bare number branch divides by 1,000,000,000', () => {
    expect(parseQuotaValue('memory', '1000000000')).toBe(1.0)
    expect(parseQuotaValue('memory', '1500000000')).toBe(1.5)
  })

  test('throws on invalid value', () => {
    expect(() => parseQuotaValue('memory', '5Z')).toThrow('Invalid value')
    expect(() => parseQuotaValue('memory', 'oops')).toThrow('Invalid value')
  })
})

describe('parseQuotaValueCpu', () => {
  test('parses cpu string like main cpu branch', () => {
    expect(parseQuotaValueCpu('500m')).toBe(0.5)
    expect(parseQuotaValueCpu('1234m')).toBe(1.2)
    expect(parseQuotaValueCpu('2')).toBe(2.0)
  })

  test('returns 0 for non-string inputs', () => {
    expect(parseQuotaValueCpu(undefined)).toBe(0)
    expect(parseQuotaValueCpu(null)).toBe(0)
    expect(parseQuotaValueCpu(123 as any)).toBe(0)
  })
})

describe('parseQuotaValueMemoryAndStorage', () => {
  test('handles metric units', () => {
    expect(parseQuotaValueMemoryAndStorage('500000k')).toBe(0.5) // /1e6
    expect(parseQuotaValueMemoryAndStorage('500m')).toBe(0.5) // /1000
    expect(parseQuotaValueMemoryAndStorage('500M')).toBe(0.5) // /1000
    expect(parseQuotaValueMemoryAndStorage('2G')).toBe(2.0)
    expect(parseQuotaValueMemoryAndStorage('2T')).toBe(2000.0)
  })

  test('handles large metric units P/E', () => {
    expect(parseQuotaValueMemoryAndStorage('1P')).toBe(1000000.0)
    expect(parseQuotaValueMemoryAndStorage('1E')).toBe(1000000000.0)
  })

  test('handles binary units Ki/Mi/Gi and floors', () => {
    // Ki: numericValue * 1024 / 1e9
    // 100,000 Ki -> 0.1024 -> 0.1
    expect(parseQuotaValueMemoryAndStorage('100000Ki')).toBe(0.1)

    // Mi: / 1_048.576; use value that equals 1 GB
    expect(parseQuotaValueMemoryAndStorage('1048.576Mi')).toBe(1.0)

    // Gi: 1 * 1.073741824 -> 1.0 after floor to 1 decimal
    expect(parseQuotaValueMemoryAndStorage('1Gi')).toBe(1.0)
  })

  test('handles Ti/Pi/Ei branches', () => {
    // These constants are approximate conversions to GB
    expect(parseQuotaValueMemoryAndStorage('1Ti')).toBe(1.0)
    expect(parseQuotaValueMemoryAndStorage('1Pi')).toBe(1.1)
    expect(parseQuotaValueMemoryAndStorage('1Ei')).toBe(1.1)
  })

  test('returns 0 when val is "0"', () => {
    expect(parseQuotaValueMemoryAndStorage('0')).toBe(0)
  })

  test('throws on invalid strings', () => {
    expect(() => parseQuotaValueMemoryAndStorage('5Z')).toThrow('Invalid value')
    expect(() => parseQuotaValueMemoryAndStorage('oops')).toThrow('Invalid value')
  })

  test('returns 0 for non-string inputs', () => {
    expect(parseQuotaValueMemoryAndStorage(undefined)).toBe(0)
    expect(parseQuotaValueMemoryAndStorage(null)).toBe(0)
    expect(parseQuotaValueMemoryAndStorage(10 as any)).toBe(0)
  })
})
