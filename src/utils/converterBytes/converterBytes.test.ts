/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TUnitInput } from 'localTypes/factories/converterBytes'
import { convertBytes, formatBytesAuto, toBytes, convertStorage, parseValueWithUnit } from './converterBytes'

describe('byte utils', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('convertBytes', () => {
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    it('converts bytes to SI units (canonical)', () => {
      expect(convertBytes(1000, 'kB')).toBe(1)
      expect(convertBytes(1_000_000, 'MB')).toBe(1)
      expect(convertBytes(1_000_000_000, 'GB')).toBe(1)
    })

    it('converts bytes to IEC units (canonical)', () => {
      expect(convertBytes(1024, 'KiB')).toBe(1)
      expect(convertBytes(1024 ** 2, 'MiB')).toBe(1)
      expect(convertBytes(1024 ** 3, 'GiB')).toBe(1)
    })

    it('supports case-insensitive and alias units for SI', () => {
      expect(convertBytes(1000, 'k')).toBe(1)
      expect(convertBytes(1000, 'kb')).toBe(1)
      expect(convertBytes(1000, 'KB')).toBe(1)
      expect(convertBytes(1_000_000_000, 'g')).toBe(1)
      expect(convertBytes(1_000_000_000, 'GB')).toBe(1)
    })

    it('supports case-insensitive and alias units for IEC', () => {
      expect(convertBytes(1024, 'ki')).toBe(1)
      expect(convertBytes(1024, 'kib')).toBe(1)
      expect(convertBytes(1024, 'Ki')).toBe(1)
      expect(convertBytes(1024 ** 3, 'gi')).toBe(1)
      expect(convertBytes(1024 ** 3, 'GiB')).toBe(1)
    })

    it('trims whitespace on unit input', () => {
      expect(convertBytes(1_000_000, '  mb  ' as any)).toBe(1)
    })

    it('formats output when format=true with specified locale and precision', () => {
      const result = convertBytes(1500, 'kB', { format: true, precision: 1, locale: 'en-US' })
      expect(result).toBe('1.5 kB')
    })

    it('uses default precision=2 when formatting', () => {
      const result = convertBytes(1_500_000, 'MB', { format: true, locale: 'en-US' }) as string
      const [num, unit] = result.split(' ')
      // 1_500_000 / 1_000_000 = 1.5 -> "1.5"
      expect(unit).toBe('MB')
      expect(num).toBe('1.5')
    })

    it('falls back to GB and logs when unit is unknown', () => {
      const result = convertBytes(1_000_000_000, 'unknown' as any)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown unit: "unknown"')
      // treated as GB
      expect(result).toBe(1)
    })

    it('returns -1 and logs when bytes is not finite', () => {
      const result = convertBytes(NaN, 'GB')
      expect(consoleErrorSpy).toHaveBeenCalledWith('bytes must be a finite number')
      expect(result).toBe(-1)
    })

    it('returns -1 and logs when bytes is negative', () => {
      const result = convertBytes(-1, 'GB')
      expect(consoleErrorSpy).toHaveBeenCalledWith('bytes must be >= 0')
      expect(result).toBe(-1)
    })
  })

  describe('formatBytesAuto', () => {
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    it('auto-scales using SI units by default', () => {
      const result = formatBytesAuto(1_234_567_890, { precision: 2, locale: 'en-US' })
      // Example says ~ "1.23 GB"
      expect(result.endsWith(' GB')).toBe(true)
      const numeric = parseFloat(result.split(' ')[0])
      expect(numeric).toBeCloseTo(1.23, 2)
    })

    it('auto-scales using IEC units when standard="iec"', () => {
      const result = formatBytesAuto(1_234_567_890, { standard: 'iec', precision: 2, locale: 'en-US' })
      // Example says ~ "1.15 GiB"
      expect(result.endsWith(' GiB')).toBe(true)
      const numeric = parseFloat(result.split(' ')[0])
      expect(numeric).toBeCloseTo(1.15, 2)
    })

    it('keeps small values in bytes for SI', () => {
      const result = formatBytesAuto(999, { precision: 2, locale: 'en-US' })
      expect(result.endsWith(' B')).toBe(true)
      const numeric = parseFloat(result.split(' ')[0])
      expect(numeric).toBeCloseTo(999, 2)
    })

    it('keeps small values in bytes for IEC', () => {
      const result = formatBytesAuto(512, { standard: 'iec', precision: 2, locale: 'en-US' })
      expect(result.endsWith(' B')).toBe(true)
      const numeric = parseFloat(result.split(' ')[0])
      expect(numeric).toBeCloseTo(512, 2)
    })

    it('handles zero bytes', () => {
      const si = formatBytesAuto(0, { precision: 2, locale: 'en-US' })
      const iec = formatBytesAuto(0, { standard: 'iec', precision: 2, locale: 'en-US' })

      expect(si).toBe('0 B')
      expect(iec).toBe('0 B')
    })

    it('returns "infinite" and logs when bytes is not finite', () => {
      const result = formatBytesAuto(Infinity)
      expect(consoleErrorSpy).toHaveBeenCalledWith('bytes must be a finite number')
      expect(result).toBe('infinite')
    })

    it('returns "less then zero" and logs when bytes is negative', () => {
      const result = formatBytesAuto(-1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('bytes must be >= 0')
      expect(result).toBe('less then zero')
    })

    it('respects custom precision', () => {
      const result = formatBytesAuto(1_500_000_000, { precision: 3, locale: 'en-US' })
      const [num, unit] = result.split(' ')
      expect(unit).toBe('GB')
      // 1_500_000_000 / 1_000_000_000 = 1.5 -> "1.500" with precision=3
      expect(num).toBe('1.5' /* may be "1.5" or "1.500" depending on rounding rules */)
    })
  })
  describe('toBytes', () => {
    it('converts from canonical SI units to bytes', () => {
      expect(toBytes(1, 'GB')).toBe(1_000_000_000)
      expect(toBytes(2, 'MB')).toBe(2_000_000)
    })

    it('converts from canonical IEC units to bytes', () => {
      expect(toBytes(1, 'GiB')).toBe(1024 ** 3)
      expect(toBytes(2, 'MiB')).toBe(2 * 1024 ** 2)
    })

    it('supports alias units via normalizeUnit (e.g. Gi -> GiB)', () => {
      // 'Gi' should normalize to 'GiB'
      expect(toBytes(1, 'Gi')).toBe(1024 ** 3)
    })

    it('returns -1 and logs when value is not finite', () => {
      const result = toBytes(NaN, 'GB')
      expect(consoleErrorSpy).toHaveBeenCalledWith('value must be a finite number')
      expect(result).toBe(-1)
    })

    it('returns -1 and logs when value is negative', () => {
      const result = toBytes(-1, 'GB')
      expect(consoleErrorSpy).toHaveBeenCalledWith('value must be >= 0')
      expect(result).toBe(-1)
    })

    it('falls back to GB and logs when unit is unknown', () => {
      const result = toBytes(1, 'unknown' as TUnitInput)
      // normalizeUnit should log:
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown unit: "unknown"')
      // and fallback to 'GB' factor
      expect(result).toBe(1_000_000_000)
    })
  })

  // ---------------------------------------------------------------------------
  // convertStorage
  // ---------------------------------------------------------------------------
  describe('convertStorage', () => {
    it('converts between SI units (e.g. MB -> GB)', () => {
      const result = convertStorage(1500, 'MB', 'GB') as number
      // 1500 MB = 1.5 GB
      expect(result).toBeCloseTo(1.5, 6)
    })

    it('converts between IEC units (e.g. MiB -> GiB)', () => {
      const result = convertStorage(2048, 'MiB', 'GiB') as number
      // 2048 MiB = 2 GiB
      expect(result).toBeCloseTo(2, 6)
    })

    it('supports alias units for from/to (e.g. Gi -> gb)', () => {
      const result = convertStorage(1, 'Gi', 'gb' as TUnitInput) as number
      // 1 GiB in bytes = 1024^3 -> in GB = / 1e9
      const expected = 1024 ** 3 / 1_000_000_000
      expect(result).toBeCloseTo(expected, 10)
    })

    it('supports formatting options', () => {
      const result = convertStorage(1536, 'KiB', 'MiB', {
        format: true,
        precision: 1,
        locale: 'en-US',
      }) as string
      // 1536 KiB = 1.5 MiB => "1.5 MiB"
      const [num, unit] = result.split(' ')
      expect(unit).toBe('MiB')
      expect(parseFloat(num)).toBeCloseTo(1.5, 1)
    })

    it('returns -1 and logs when value is not finite', () => {
      const result = convertStorage(NaN, 'GB', 'GiB')
      expect(consoleErrorSpy).toHaveBeenCalledWith('value must be a finite number')
      expect(result).toBe(-1)
    })

    it('returns -1 and logs when value is negative', () => {
      const result = convertStorage(-10, 'GB', 'GiB')
      expect(consoleErrorSpy).toHaveBeenCalledWith('value must be >= 0')
      expect(result).toBe(-1)
    })

    it('propagates unknown-unit fallback from toBytes/normalizeUnit', () => {
      const result = convertStorage(1, 'GB', 'unknown' as TUnitInput)
      // normalizeUnit('unknown') logs and falls back to 'GB'
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown unit: "unknown"')
      // converting 1 GB -> (fallback) GB = 1
      expect(result).toBe(1)
    })
  })

  // ---------------------------------------------------------------------------
  // parseValueWithUnit
  // ---------------------------------------------------------------------------
  describe('parseValueWithUnit', () => {
    it('parses plain number without unit', () => {
      const res = parseValueWithUnit('1000')
      expect(res).not.toBeNull()
      expect(res!.value).toBe(1000)
      expect(res!.unit).toBeUndefined()
    })

    it('parses number with inline unit without space (e.g. "12312312Ki")', () => {
      const res = parseValueWithUnit('12312312Ki')
      expect(res).not.toBeNull()
      expect(res!.value).toBe(12312312)
      expect(res!.unit).toBe('Ki')
    })

    it('parses number with inline unit with space (e.g. "12.5 GiB")', () => {
      const res = parseValueWithUnit('  12.5 GiB ')
      expect(res).not.toBeNull()
      expect(res!.value).toBeCloseTo(12.5, 6)
      expect(res!.unit).toBe('GiB')
    })

    it('supports sign (+/-) in the numeric part', () => {
      const plus = parseValueWithUnit('+42MB')
      const minus = parseValueWithUnit('-10Gi')

      expect(plus).not.toBeNull()
      expect(plus!.value).toBe(42)
      expect(plus!.unit).toBe('MB')

      expect(minus).not.toBeNull()
      expect(minus!.value).toBe(-10)
      expect(minus!.unit).toBe('Gi')
    })

    it('returns null for empty or whitespace-only input', () => {
      expect(parseValueWithUnit('')).toBeNull()
      expect(parseValueWithUnit('   ')).toBeNull()
    })

    it('returns null when the string does not match the pattern', () => {
      expect(parseValueWithUnit('abc')).toBeNull()
      expect(parseValueWithUnit('123.abc')).toBeNull()
      expect(parseValueWithUnit('12,34GB')).toBeNull() // comma breaks the regex
    })

    it('returns null when numeric part cannot be converted to a finite number', () => {
      // This is a bit contrived but tests the Number.isFinite guard
      const res = parseValueWithUnit('NaNGB')
      expect(res).toBeNull()
    })
  })
})
