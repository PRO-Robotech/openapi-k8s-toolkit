import { clampPercent, getDefaultQuery } from './utils'

describe('UsageGraphCard utils', () => {
  describe('clampPercent', () => {
    test('returns 0 for non-finite inputs or non-positive max', () => {
      expect(clampPercent(NaN, 10)).toBe(0)
      expect(clampPercent(10, NaN)).toBe(0)
      expect(clampPercent(10, 0)).toBe(0)
      expect(clampPercent(10, -5)).toBe(0)
    })

    test('clamps to 0..100 range', () => {
      expect(clampPercent(-10, 100)).toBe(0)
      expect(clampPercent(0, 100)).toBe(0)
      expect(clampPercent(50, 100)).toBe(50)
      expect(clampPercent(150, 100)).toBe(100)
    })
  })

  describe('getDefaultQuery', () => {
    test('returns cpu query for cpu titles', () => {
      expect(getDefaultQuery('CPU, core')).toBe('sum(rate(container_cpu_usage_seconds_total[5m]))')
    })

    test('returns memory query for memory titles', () => {
      expect(getDefaultQuery('Memory, GB')).toBe('container_memory_usage_bytes')
    })

    test('returns fs query for storage titles', () => {
      expect(getDefaultQuery('Ephemeral Storage, GB')).toBe('container_fs_usage_bytes')
      expect(getDefaultQuery('Disk, IOPS')).toBe('container_fs_usage_bytes')
      expect(getDefaultQuery('Storage')).toBe('container_fs_usage_bytes')
    })

    test('returns undefined when no match', () => {
      expect(getDefaultQuery('Requests')).toBeUndefined()
      expect(getDefaultQuery()).toBeUndefined()
    })
  })
})
