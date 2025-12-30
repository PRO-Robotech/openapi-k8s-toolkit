/* eslint-disable no-console */
export type TPrometheusRangeParams = {
  start: string
  end: string
  step: string
}

/**
 * Converts a duration string like "30m", "2h", "7d" into start/end ISO timestamps
 * and a safe step value to ensure < 11k data points for Prometheus query_range.
 */
export const buildPrometheusRangeParams = (range: string = '1h'): TPrometheusRangeParams => {
  const now = new Date()
  const end = now.toISOString()

  // Extract numeric amount and unit from range ("6h", "30m", etc.)
  const amount = parseInt(range, 10)
  const unit = range.replace(amount.toString(), '').toLowerCase()

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
  }

  if (!multipliers[unit]) {
    console.warn(`⚠️ Unknown time range "${range}", falling back to 1h.`)
    return buildPrometheusRangeParams('1h') // recursion is safe due to validated value
  }

  const startDate = new Date(now.getTime() - amount * multipliers[unit])
  const start = startDate.toISOString()

  // Avoid Prometheus resolution errors (>11k points)
  const durationSeconds = (now.getTime() - startDate.getTime()) / 1000
  const stepSeconds = Math.max(10, Math.floor(durationSeconds / 1000))

  return {
    start,
    end,
    step: `${stepSeconds}s`,
  }
}
