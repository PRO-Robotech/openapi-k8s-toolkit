/* eslint-disable @typescript-eslint/no-explicit-any */
import { eventKey, compareRV, getRV, getMaxRV } from './utils'

describe('eventKey', () => {
  test('builds key from namespace/name', () => {
    const e = {
      metadata: { name: 'ev1', namespace: 'ns1' },
    } as any

    expect(eventKey(e)).toBe('ns1/ev1')
  })

  test('handles missing metadata fields', () => {
    expect(eventKey({} as any)).toBe('/')
    expect(eventKey({ metadata: { name: 'ev1' } } as any)).toBe('/ev1')
    expect(eventKey({ metadata: { namespace: 'ns1' } } as any)).toBe('ns1/')
  })
})

describe('compareRV', () => {
  test('compares by length first', () => {
    expect(compareRV('9', '10')).toBe(-1) // len 1 < len 2
    expect(compareRV('100', '99')).toBe(1) // len 3 > len 2
  })

  test('compares lexicographically when lengths equal', () => {
    expect(compareRV('10', '11')).toBe(-1)
    expect(compareRV('11', '10')).toBe(1)
    expect(compareRV('abc', 'abd')).toBe(-1)
  })

  test('returns 0 when equal', () => {
    expect(compareRV('123', '123')).toBe(0)
  })
})

describe('getRV', () => {
  test('returns metadata.resourceVersion', () => {
    const item = { metadata: { resourceVersion: '42' } } as any
    expect(getRV(item)).toBe('42')
  })

  test('returns undefined when missing', () => {
    expect(getRV({} as any)).toBeUndefined()
    expect(getRV({ metadata: {} } as any)).toBeUndefined()
  })
})

describe('getMaxRV', () => {
  test('returns undefined for empty list', () => {
    expect(getMaxRV([])).toBeUndefined()
  })

  test('ignores items without RV', () => {
    const items = [{}, { metadata: {} }, { metadata: { resourceVersion: '2' } }] as any
    expect(getMaxRV(items)).toBe('2')
  })

  test('returns max using compareRV semantics', () => {
    const items = [
      { metadata: { resourceVersion: '9' } },
      { metadata: { resourceVersion: '10' } },
      { metadata: { resourceVersion: '2' } },
    ] as any

    // length-based: '10' should win over '9' and '2'
    expect(getMaxRV(items)).toBe('10')
  })

  test('works with equal-length lexicographic ordering', () => {
    const items = [
      { metadata: { resourceVersion: '100' } },
      { metadata: { resourceVersion: '101' } },
      { metadata: { resourceVersion: '099' } },
    ] as any

    expect(getMaxRV(items)).toBe('101')
  })
})
