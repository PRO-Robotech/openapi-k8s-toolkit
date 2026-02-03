import { getNormalizedByteUnit, getNormalizedCoreUnit } from './utils'

describe('FormattedValue utils', () => {
  describe('getNormalizedCoreUnit', () => {
    test('returns core for values >= 1', () => {
      expect(getNormalizedCoreUnit(1)).toBe('core')
      expect(getNormalizedCoreUnit(2.5)).toBe('core')
    })

    test('returns mcore for values in [1e-3, 1)', () => {
      expect(getNormalizedCoreUnit(0.5)).toBe('mcore')
      expect(getNormalizedCoreUnit(0.001)).toBe('mcore')
    })

    test('returns ucore for values in [1e-6, 1e-3)', () => {
      expect(getNormalizedCoreUnit(1e-4)).toBe('ucore')
      expect(getNormalizedCoreUnit(1e-6)).toBe('ucore')
    })

    test('returns ncore for values below 1e-6', () => {
      expect(getNormalizedCoreUnit(1e-7)).toBe('ncore')
      expect(getNormalizedCoreUnit(0)).toBe('ncore')
    })
  })

  describe('getNormalizedByteUnit', () => {
    test('returns B for zero or sub-base values', () => {
      expect(getNormalizedByteUnit(0, 'si')).toBe('B')
      expect(getNormalizedByteUnit(1, 'si')).toBe('B')
      expect(getNormalizedByteUnit(1023, 'iec')).toBe('B')
    })

    test('returns base-1000 units for si', () => {
      expect(getNormalizedByteUnit(1_000, 'si')).toBe('kB')
      expect(getNormalizedByteUnit(1_000_000, 'si')).toBe('MB')
      expect(getNormalizedByteUnit(1_000_000_000, 'si')).toBe('GB')
      expect(getNormalizedByteUnit(1_000_000_000_000, 'si')).toBe('TB')
    })

    test('returns base-1024 units for iec', () => {
      expect(getNormalizedByteUnit(1024, 'iec')).toBe('KiB')
      expect(getNormalizedByteUnit(1024 ** 2, 'iec')).toBe('MiB')
      expect(getNormalizedByteUnit(1024 ** 3, 'iec')).toBe('GiB')
      expect(getNormalizedByteUnit(1024 ** 4, 'iec')).toBe('TiB')
    })
  })
})
