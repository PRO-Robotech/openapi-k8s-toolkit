import { buildPrometheusRangeParams, TPrometheusRangeParams } from './buildPrometheusRangeParams'

describe('buildPrometheusRangeParams', () => {
  let nowSpy: jest.SpyInstance

  beforeAll(() => {
    // Freeze time so test is deterministic
    nowSpy = jest.spyOn(global.Date, 'now').mockImplementation(() => 1700000000000) // fixed timestamp
  })

  afterAll(() => {
    nowSpy.mockRestore()
  })

  const isIsoDate = (value: string): boolean =>
    !Number.isNaN(Date.parse(value)) && value.includes('T') && value.endsWith('Z')

  it('returns valid structure with default (1h)', () => {
    const result: TPrometheusRangeParams = buildPrometheusRangeParams()

    expect(result).toHaveProperty('start')
    expect(result).toHaveProperty('end')
    expect(result).toHaveProperty('step')

    expect(isIsoDate(result.start)).toBe(true)
    expect(isIsoDate(result.end)).toBe(true)

    // step should be dynamic but >= 10s
    const numericStep = parseInt(result.step.replace('s', ''), 10)
    expect(numericStep).toBeGreaterThanOrEqual(10)
  })

  it('computes correct start for 30m', () => {
    const result = buildPrometheusRangeParams('30m')

    const endTime = new Date(result.end).getTime()
    const startTime = new Date(result.start).getTime()

    expect(endTime - startTime).toBe(30 * 60 * 1000) // 30 minutes in ms
  })

  it('computes correct start for 2h', () => {
    const result = buildPrometheusRangeParams('2h')

    const endTime = new Date(result.end).getTime()
    const startTime = new Date(result.start).getTime()

    expect(endTime - startTime).toBe(2 * 60 * 60 * 1000) // 2 hours
  })

  it('computes correct start for 1d', () => {
    const result = buildPrometheusRangeParams('1d')

    const endTime = new Date(result.end).getTime()
    const startTime = new Date(result.start).getTime()

    expect(endTime - startTime).toBe(24 * 60 * 60 * 1000) // 1 day
  })

  it('falls back to 1h on invalid input', () => {
    const result = buildPrometheusRangeParams('invalid-value')

    const endTime = new Date(result.end).getTime()
    const startTime = new Date(result.start).getTime()

    expect(endTime - startTime).toBe(60 * 60 * 1000) // 1 hour fallback
  })

  it('ensures step is safe (>= 10 seconds)', () => {
    const result = buildPrometheusRangeParams('10s')

    const numericStep = parseInt(result.step.replace('s', ''), 10)
    expect(numericStep).toBeGreaterThanOrEqual(10)
  })

  it('produces consistent output shape', () => {
    const result = buildPrometheusRangeParams('6h')

    expect(result).toEqual(
      expect.objectContaining({
        start: expect.any(String),
        end: expect.any(String),
        step: expect.any(String),
      }),
    )
  })
})
