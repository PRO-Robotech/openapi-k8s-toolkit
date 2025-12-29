import { formatDateAuto } from './converterDates'

describe('formatDateAuto', () => {
  const ISO = '2025-12-29T10:11:12.000Z'
  const DATE = new Date(ISO)

  // Use a stable timezone for deterministic output.
  // (Node supports this via ICU; set it once for the suite.)
  const ORIGINAL_TZ = process.env.TZ

  beforeAll(() => {
    process.env.TZ = 'UTC'
  })

  afterAll(() => {
    process.env.TZ = ORIGINAL_TZ
  })

  test('returns "Invalid date" for invalid input', () => {
    expect(formatDateAuto('not-a-date')).toBe('Invalid date')
    expect(formatDateAuto(NaN)).toBe('Invalid date')
    expect(formatDateAuto(new Date('invalid'))).toBe('Invalid date')
  })

  test('style=iso returns normalized ISO string (UTC)', () => {
    expect(formatDateAuto(ISO, { style: 'iso' })).toBe('2025-12-29T10:11:12.000Z')
    expect(formatDateAuto(DATE, { style: 'iso' })).toBe('2025-12-29T10:11:12.000Z')
  })

  test('default style is datetime (no throw, returns string)', () => {
    const s = formatDateAuto(ISO, { locale: 'en-US', timeZone: 'UTC' })
    expect(typeof s).toBe('string')
    expect(s.length).toBeGreaterThan(0)
  })

  test('style=date returns a date-only string (en-US, UTC)', () => {
    const s = formatDateAuto(ISO, { style: 'date', locale: 'en-US', timeZone: 'UTC' })
    // With year/month/day only, it should contain year and month name, and not contain a colon.
    expect(s).toContain('2025')
    expect(s).toMatch(/December/i)
    expect(s).not.toContain(':')
  })

  test('style=time without seconds does not include seconds', () => {
    const s = formatDateAuto(ISO, { style: 'time', locale: 'en-US', timeZone: 'UTC', seconds: false, hour12: false })
    // Expect HH:MM and not HH:MM:SS
    expect(s).toMatch(/\b10:11\b/)
    expect(s).not.toMatch(/\b10:11:12\b/)
  })

  test('style=time with seconds includes seconds', () => {
    const s = formatDateAuto(ISO, { style: 'time', locale: 'en-US', timeZone: 'UTC', seconds: true, hour12: false })
    expect(s).toMatch(/\b10:11:12\b/)
  })

  test('style=datetime includes date and time', () => {
    const s = formatDateAuto(ISO, {
      style: 'datetime',
      locale: 'en-US',
      timeZone: 'UTC',
      seconds: false,
      hour12: false,
    })
    expect(s).toContain('2025')
    expect(s).toMatch(/\b10:11\b/)
  })

  test('style=timestamp uses 2-digit month/day and always includes seconds', () => {
    const s = formatDateAuto(ISO, { style: 'timestamp', locale: 'en-US', timeZone: 'UTC', hour12: false })
    // en-US numeric date typically: "12/29/2025, 10:11:12"
    // Some environments use different separators, so be flexible:
    expect(s).toContain('2025')
    expect(s).toMatch(/\b10:11:12\b/)
    expect(s).toMatch(/\b12\b/) // month
    expect(s).toMatch(/\b29\b/) // day
  })

  test('style=full includes timezone name when timeZoneName is set or defaulted', () => {
    const s = formatDateAuto(ISO, { style: 'full', locale: 'en-US', timeZone: 'UTC', hour12: false })
    // In UTC, timezone name commonly appears as "UTC" or "GMT".
    expect(s).toMatch(/\b(UTC|GMT)\b/)
    expect(s).toMatch(/\b10:11:12\b/)
  })

  test('style=custom uses provided Intl.DateTimeFormatOptions', () => {
    const s = formatDateAuto(ISO, {
      style: 'custom',
      locale: 'en-US',
      timeZone: 'UTC',
      intl: { weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit' },
    })
    // Example: "Mon, 12/29/25" (exact punctuation can vary)
    expect(s).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/)
    expect(s).toMatch(/\b25\b/)
    expect(s).not.toContain(':') // no time fields requested
  })

  describe('relative', () => {
    test('style=relative formats future time as "in ..." (en-US)', () => {
      const now = '2025-12-29T10:00:00.000Z'
      const future = '2025-12-29T12:00:00.000Z'

      const s = formatDateAuto(future, {
        style: 'relative',
        locale: 'en-US',
        relative: { now, numeric: 'always' },
      })

      // Expect something like "in 2 hours"
      expect(s).toMatch(/^in\s+\d+\s+hour/)
    })

    test('style=relative formats past time as "... ago" (en-US)', () => {
      const now = '2025-12-29T10:00:00.000Z'
      const past = '2025-12-29T09:00:00.000Z'

      const s = formatDateAuto(past, {
        style: 'relative',
        locale: 'en-US',
        relative: { now, numeric: 'always' },
      })

      // Expect something like "1 hour ago"
      expect(s).toMatch(/\bhour\b.*\bago\b/)
    })

    test('style=relative supports forcing a unit', () => {
      const now = '2025-12-29T10:00:00.000Z'
      const future = '2025-12-31T10:00:00.000Z' // +2 days

      const s = formatDateAuto(future, {
        style: 'relative',
        locale: 'en-US',
        relative: { now, unit: 'hour', numeric: 'always' },
      })

      // +48 hours => should mention hour(s)
      expect(s).toMatch(/\bhours?\b/)
    })
  })

  test('accepts epoch milliseconds input', () => {
    const ms = DATE.getTime()
    const s = formatDateAuto(ms, { style: 'iso' })
    expect(s).toBe('2025-12-29T10:11:12.000Z')
  })

  test('hour12=true produces AM/PM in en-US for time style', () => {
    const s = formatDateAuto(ISO, {
      style: 'time',
      locale: 'en-US',
      timeZone: 'UTC',
      seconds: false,
      hour12: true,
    })
    // 10:11 AM expected in en-US; some envs include narrow no-break spaces.
    expect(s).toMatch(/AM|PM/i)
  })
})
