// utilts.test.ts (or whatever name you use)
import { convertCores, formatCoresAuto, toCores, convertCompute, parseCoresWithUnit } from './converterCores'

describe('core-units helpers (core/mcore/ucore/ncore)', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  const normalize = (s: string) => s.replace(/[^\dA-Za-z]/g, '')

  describe('convertCores', () => {
    it('converts cores to cores (identity)', () => {
      expect(convertCores(1, 'core')).toBe(1)
      expect(convertCores(2.5, 'core')).toBe(2.5)
    })

    it('converts cores to mcore', () => {
      // 0.5 core -> 500 mcore
      expect(convertCores(0.5, 'm')).toBe(500)
      expect(convertCores(1, 'mcore')).toBe(1000)
    })

    it('converts cores to ucore', () => {
      // 0.0001 core -> 100 ucore
      expect(convertCores(1e-4, 'u')).toBeCloseTo(100)
      expect(convertCores(1e-4, 'ucore')).toBeCloseTo(100)
    })

    it('converts cores to ncore', () => {
      // 0.0000001 core -> 100 ncore
      expect(convertCores(1e-7, 'n')).toBeCloseTo(100)
      expect(convertCores(1e-7, 'ncore')).toBeCloseTo(100)
    })

    it('supports aliases for all units', () => {
      // cores aliases
      expect(convertCores(2, 'cpu')).toBe(2)
      expect(convertCores(2, 'cpus')).toBe(2)
      expect(convertCores(1, 'vcpu')).toBe(1)
      expect(convertCores(1, 'vcpus')).toBe(1)

      // millicore aliases
      expect(convertCores(1, 'millicore')).toBe(1000)
      expect(convertCores(1, 'millicores')).toBe(1000)
      expect(convertCores(1, 'millicpu')).toBe(1000)

      // microcore aliases
      expect(convertCores(1e-6, 'micro')).toBe(1)
      expect(convertCores(1e-6, 'microcore')).toBe(1)

      // nanocore aliases
      expect(convertCores(1e-9, 'nano')).toBe(1)
      expect(convertCores(1e-9, 'nanocore')).toBe(1)
    })

    it('formats value when opts.format=true (locale agnostic)', () => {
      const result = convertCores(0.5, 'm', { format: true, precision: 0 })
      // 0.5 core -> 500 mcore
      expect(normalize(String(result))).toBe('500mcore')
    })

    it('defaults to "core" when unit is unknown and logs an error', () => {
      const result = convertCores(2, 'something-weird', { format: true, precision: 2 })
      expect(normalize(String(result))).toBe('2core')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown core unit: "something-weird"')
    })

    it('returns -1 and logs error for non-finite cores', () => {
      expect(convertCores(Number.POSITIVE_INFINITY, 'core')).toBe(-1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('cores must be a finite number')
    })

    it('returns -1 and logs error for negative cores', () => {
      expect(convertCores(-1, 'core')).toBe(-1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('cores must be >= 0')
    })
  })

  describe('formatCoresAuto', () => {
    it('returns "0 core" for zero', () => {
      expect(formatCoresAuto(0)).toBe('0 core')
    })

    it('uses core for values >= 1', () => {
      const result = formatCoresAuto(2)
      expect(normalize(result)).toBe('2core')
    })

    it('uses mcore for 1e-3 <= cores < 1', () => {
      const result = formatCoresAuto(0.25) // 0.25 core -> 250 mcore
      expect(normalize(result)).toBe('250mcore')
    })

    it('uses ucore for 1e-6 <= cores < 1e-3', () => {
      const result = formatCoresAuto(1e-4) // 0.0001 core -> 100 ucore
      expect(normalize(result)).toBe('100ucore')
    })

    it('uses ncore for cores < 1e-6', () => {
      const result = formatCoresAuto(1e-7) // 0.0000001 core -> 100 ncore
      expect(normalize(result)).toBe('100ncore')
    })

    it('returns "infinite" and logs error for non-finite input', () => {
      const result = formatCoresAuto(Number.POSITIVE_INFINITY)
      expect(result).toBe('infinite')
      expect(consoleErrorSpy).toHaveBeenCalledWith('cores must be a finite number')
    })

    it('returns "less then zero" and logs error for negative input', () => {
      const result = formatCoresAuto(-0.1)
      expect(result).toBe('less then zero')
      expect(consoleErrorSpy).toHaveBeenCalledWith('cores must be >= 0')
    })
  })

  describe('toCores', () => {
    it('converts millicores to cores', () => {
      // 500 mcore -> 0.5 core
      expect(toCores(500, 'm')).toBeCloseTo(0.5)
    })

    it('converts microcores to cores', () => {
      // 100 ucore -> 100 * 1e-6 = 0.0001 core
      expect(toCores(100, 'ucore')).toBeCloseTo(1e-4)
    })

    it('converts nanocores to cores', () => {
      // 100 ncore -> 100 * 1e-9 = 1e-7 core
      expect(toCores(100, 'n')).toBeCloseTo(1e-7)
    })

    it('handles core as identity', () => {
      expect(toCores(1, 'core')).toBe(1)
    })

    it('returns -1 and logs error for non-finite value', () => {
      expect(toCores(Number.NaN, 'core')).toBe(-1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('value must be a finite number')
    })

    it('returns -1 and logs error for negative value', () => {
      expect(toCores(-10, 'm')).toBe(-1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('value must be >= 0')
    })
  })

  describe('convertCompute', () => {
    it('converts between mcore and core using cores as intermediate', () => {
      // 500 m -> 0.5 core
      expect(convertCompute(500, 'm', 'core')).toBeCloseTo(0.5)
      // 2 core -> 2000 mcore
      expect(convertCompute(2, 'core', 'm')).toBe(2000)
    })

    it('converts between ncore and core', () => {
      // 1_000_000 ncore -> 0.001 core
      expect(convertCompute(1_000_000, 'n', 'core')).toBeCloseTo(0.001)
    })

    it('formats result when opts.format=true (locale agnostic)', () => {
      const result = convertCompute(2, 'core', 'm', { format: true, precision: 0 })
      expect(normalize(String(result))).toBe('2000mcore')
    })

    it('propagates -1 when toCores fails', () => {
      const result = convertCompute(Number.NaN, 'core', 'm')
      expect(result).toBe(-1)
    })
  })

  describe('parseCoresWithUnit', () => {
    it('parses value with unit (m, core, vcpu, n, u, µ)', () => {
      expect(parseCoresWithUnit('500m')).toEqual({ value: 500, unit: 'm' })
      expect(parseCoresWithUnit(' 0.5 core ')).toEqual({ value: 0.5, unit: 'core' })
      expect(parseCoresWithUnit('2 vcpu')).toEqual({ value: 2, unit: 'vcpu' })
      expect(parseCoresWithUnit('1000000n')).toEqual({ value: 1_000_000, unit: 'n' })
      expect(parseCoresWithUnit('10u')).toEqual({ value: 10, unit: 'u' })
      expect(parseCoresWithUnit('10µ')).toEqual({ value: 10, unit: 'µ' }) // micro sign
    })

    it('parses value without unit', () => {
      expect(parseCoresWithUnit('1.5')).toEqual({ value: 1.5 })
    })

    it('returns null for empty or whitespace-only input', () => {
      expect(parseCoresWithUnit('')).toBeNull()
      expect(parseCoresWithUnit('   ')).toBeNull()
    })

    it('returns null for non-matching patterns', () => {
      expect(parseCoresWithUnit('abc')).toBeNull()
      expect(parseCoresWithUnit('1.2.3 core')).toBeNull()
    })

    it('returns null for non-finite numeric part', () => {
      expect(parseCoresWithUnit('NaN core')).toBeNull()
      expect(parseCoresWithUnit('Infinity core')).toBeNull()
    })
  })
})
