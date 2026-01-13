// date formatter with presets + overrides
export type TDateFormatStyle =
  | 'date'
  | 'time'
  | 'datetime'
  | 'timestamp' // date+time+seconds
  | 'full' // date+time+seconds+tz
  | 'relative'
  | 'iso' // normalized ISO string
  | 'custom'

export type TDateInput = string | number | Date

export type TDateFormatOptions = {
  style?: TDateFormatStyle
  locale?: string
  timeZone?: string
  hour12?: boolean

  /**
   * Precision / verbosity toggles used by presets
   */
  seconds?: boolean // include seconds when relevant
  timeZoneName?: 'short' | 'long' | 'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric'

  /**
   * For relative formatting
   */
  relative?: {
    unit?: Intl.RelativeTimeFormatUnit // default chosen automatically
    numeric?: 'always' | 'auto'
    // if provided, compare against this "now" (useful for tests)
    now?: TDateInput
  }

  /**
   * Only used when style === 'custom'
   * Anything you pass here overrides the preset options.
   */
  intl?: Intl.DateTimeFormatOptions
}

const toDate = (input: TDateInput): Date | null => {
  const d = input instanceof Date ? input : new Date(input)
  return Number.isFinite(d.getTime()) ? d : null
}

/**
 * Validates if a string is in RFC3339 format (e.g., "2024-01-01T00:00:00Z" or "2024-01-01T00:00:00+02:00")
 * Used by Kubernetes API for timestamp parameters like sinceTime.
 */
export const isValidRFC3339 = (dateString: string): boolean => {
  const rfc3339Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
  if (!rfc3339Regex.test(dateString)) {
    return false
  }
  const date = new Date(dateString)
  return !Number.isNaN(date.getTime())
}

/**
 * Human-ish relative time (e.g., "in 2 hours", "3 days ago")
 * Uses Intl.RelativeTimeFormat and picks a unit automatically unless forced.
 */
const formatRelative = (
  date: Date,
  { locale, timeZone, relative }: Pick<TDateFormatOptions, 'locale' | 'timeZone' | 'relative'>,
): string => {
  const nowDate = relative?.now ? toDate(relative.now) ?? new Date() : new Date()

  // If a timezone is requested, we should compare in that timezone context.
  // JS Date is always UTC-backed; for relative differences, this is usually fine.
  // (We mainly keep timeZone for consistency with the rest of the API.)
  // eslint-disable-next-line no-void
  void timeZone

  const diffMs = date.getTime() - nowDate.getTime()
  const absMs = Math.abs(diffMs)

  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['week', 1000 * 60 * 60 * 24 * 7],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000],
  ]

  const forcedUnit = relative?.unit
  const [unit, unitMs] = forcedUnit
    ? divisions.find(d => d[0] === forcedUnit) ?? ['second', 1000]
    : divisions.find(([, ms]) => absMs >= ms) ?? ['second', 1000]

  const value = Math.round(diffMs / unitMs)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: relative?.numeric ?? 'auto' })
  return rtf.format(value, unit)
}

const presetIntlOptions = (style: TDateFormatStyle, opts: TDateFormatOptions): Intl.DateTimeFormatOptions => {
  const { hour12 = false, seconds, timeZoneName } = opts

  switch (style) {
    case 'date':
      return { year: 'numeric', month: 'long', day: 'numeric' }

    case 'time':
      return {
        hour: '2-digit',
        minute: '2-digit',
        ...(seconds ? { second: '2-digit' } : {}),
        hour12,
      }

    case 'datetime':
      return {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...(seconds ? { second: '2-digit' } : {}),
        hour12,
      }

    case 'timestamp':
      return {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12,
      }

    case 'full':
      return {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12,
        timeZoneName: timeZoneName ?? 'short',
      }

    case 'custom':
      return opts.intl ?? {}

    default:
      // for 'relative' and 'iso' we don't use Intl.DateTimeFormat
      return {}
  }
}

/**
 * formatLocalDate upgraded:
 * - supports styles: date/time/datetime/timestamp/full/relative/iso/custom
 * - accepts ISO string | Date | epoch ms
 * - configurable locale/timeZone/seconds/hour12
 */
export const formatDateAuto = (input: TDateInput, options: TDateFormatOptions = {}): string => {
  const date = toDate(input)
  if (!date) return 'Invalid date'

  const style = options.style ?? 'datetime'

  if (style === 'iso') {
    // normalized full ISO in UTC
    return date.toISOString()
  }

  if (style === 'relative') {
    return formatRelative(date, options)
  }

  const intlOpts = presetIntlOptions(style, options)

  return date.toLocaleString(options.locale, {
    ...intlOpts,
    ...(options.timeZone ? { timeZone: options.timeZone } : {}),
  })
}

// ---- examples ----
// formatDateAuto("2025-12-29T10:11:12Z")                       -> "December 29, 2025, 11:11:12" (depending locale/tz)
// formatDateAuto("2025-12-29T10:11:12Z", { style: "date" })   -> "December 29, 2025"
// formatDateAuto(Date.now(), { style: "time" })               -> "12:34"
// formatDateAuto(Date.now(), { style: "time", seconds: true })-> "12:34:56"
// formatDateAuto("2025-12-29T10:11:12Z", { style: "full", timeZone: "Europe/Amsterdam" })
// formatDateAuto(Date.now() + 3600_000, { style: "relative" }) -> "in 1 hour"
