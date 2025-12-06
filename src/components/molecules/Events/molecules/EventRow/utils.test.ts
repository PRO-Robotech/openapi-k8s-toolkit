/* eslint-disable @typescript-eslint/no-explicit-any */
import { eventText, timeAgo, formatEventSummary } from './utils'

describe('eventText', () => {
  test('prefers note over message', () => {
    const e = { note: 'new note', message: 'old msg' } as any
    expect(eventText(e)).toBe('new note')
  })

  test('falls back to message', () => {
    const e = { message: 'legacy msg' } as any
    expect(eventText(e)).toBe('legacy msg')
  })

  test('returns empty string when neither present', () => {
    const e = {} as any
    expect(eventText(e)).toBe('')
  })
})

describe('timeAgo', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('returns empty string when iso is missing', () => {
    expect(timeAgo(undefined)).toBe('')
    expect(timeAgo('')).toBe('')
  })

  test('formats seconds for < 60s', () => {
    const now = new Date('2025-01-01T00:00:10.000Z')
    jest.setSystemTime(now)

    const iso = '2025-01-01T00:00:05.500Z' // 4.5s diff => floor 4
    expect(timeAgo(iso)).toBe('4s ago')
  })

  test('never goes negative for future timestamps in <60s window', () => {
    const now = new Date('2025-01-01T00:00:10.000Z')
    jest.setSystemTime(now)

    const iso = '2025-01-01T00:00:20.000Z' // future
    expect(timeAgo(iso)).toBe('0s ago')
  })

  test('formats minutes for < 60m', () => {
    const now = new Date('2025-01-01T01:00:00.000Z')
    jest.setSystemTime(now)

    const iso = '2025-01-01T00:30:00.000Z' // 30m
    expect(timeAgo(iso)).toBe('30m ago')
  })

  test('formats hours for < 24h', () => {
    const now = new Date('2025-01-02T00:00:00.000Z')
    jest.setSystemTime(now)

    const iso = '2025-01-01T06:00:00.000Z' // 18h
    expect(timeAgo(iso)).toBe('18h ago')
  })

  test('returns locale string for >= 24h', () => {
    const now = new Date('2025-01-03T00:00:00.000Z')
    jest.setSystemTime(now)

    const iso = '2025-01-01T00:00:00.000Z' // 48h
    const expected = new Date(iso).toLocaleString()

    expect(timeAgo(iso)).toBe(expected)
  })
})

describe('formatEventSummary', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('returns undefined when deprecatedCount is missing/zero', () => {
    jest.setSystemTime(new Date('2025-01-10T12:00:00.000Z'))

    expect(formatEventSummary({ deprecatedFirstTimestamp: '2025-01-10T01:00:00.000Z' } as any)).toBeUndefined()
    expect(
      formatEventSummary({ deprecatedCount: 0, deprecatedFirstTimestamp: '2025-01-10T01:00:00.000Z' } as any),
    ).toBeUndefined()
  })

  test('returns undefined when deprecatedFirstTimestamp is missing', () => {
    jest.setSystemTime(new Date('2025-01-10T12:00:00.000Z'))

    expect(formatEventSummary({ deprecatedCount: 3 } as any)).toBeUndefined()
  })

  test('formats "today" when days diff is 0', () => {
    // Same calendar day within <24h difference
    jest.setSystemTime(new Date('2025-01-10T12:00:00.000Z'))

    const e = {
      deprecatedCount: 5,
      deprecatedFirstTimestamp: '2025-01-10T00:10:00.000Z',
    } as any

    expect(formatEventSummary(e)).toBe('5 times today')
  })

  test('formats "in the last N days" when days diff > 0', () => {
    jest.setSystemTime(new Date('2025-01-10T12:00:00.000Z'))

    const e = {
      deprecatedCount: 7,
      deprecatedFirstTimestamp: '2025-01-08T10:00:00.000Z',
    } as any

    // now - first ~= 2 days (floor)
    expect(formatEventSummary(e)).toBe('7 times in the last 2 days')
  })

  test('uses floor for day calculation', () => {
    jest.setSystemTime(new Date('2025-01-10T01:00:00.000Z'))

    const e = {
      deprecatedCount: 2,
      deprecatedFirstTimestamp: '2025-01-09T23:30:00.000Z',
    } as any

    // diff ~ 1.5h -> 0 days
    expect(formatEventSummary(e)).toBe('2 times today')
  })
})
