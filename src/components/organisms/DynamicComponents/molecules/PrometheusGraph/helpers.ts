/* eslint-disable no-nested-ternary */
import { formatBytesAuto } from 'utils/converterBytes'
import { formatCoresAuto } from 'utils/converterCores'
import { formatDateAuto, type TDateFormatOptions } from 'utils/converterDates'

export const createValueFormatter = ({
  formatter,
  unit,
}: {
  formatter: 'bytes' | 'cores' | 'unit' | 'none'
  unit?: string
}): ((value: unknown) => string) | undefined => {
  if (formatter === 'none') {
    return (value: unknown) => {
      return String(value)
    }
  }

  if (formatter === 'bytes') {
    return (value: unknown) => {
      const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN

      return Number.isFinite(num) ? formatBytesAuto(num) : value != null ? String(value) : ''
    }
  }

  if (formatter === 'cores') {
    return (value: unknown) => {
      const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN

      return Number.isFinite(num) ? formatCoresAuto(num) : value != null ? String(value) : ''
    }
  }

  if (formatter === 'unit') {
    return (value: unknown) => {
      const strValue = String(value)

      return `${strValue} ${unit}`
    }
  }

  return undefined
}

export const createDateFormatter = (options?: TDateFormatOptions): ((value: unknown) => string) | undefined => {
  if (!options) {
    return undefined
  }

  return (value: unknown) => {
    if (value == null) {
      return ''
    }

    let input: string | number | Date | null = null

    if (value instanceof Date) {
      input = value
    } else if (typeof value === 'number') {
      input = value
    } else if (typeof value === 'string') {
      const num = Number(value)
      input = Number.isFinite(num) ? num : value
    }

    if (input == null) {
      return ''
    }

    const formatted = formatDateAuto(input, options)
    return formatted === 'Invalid date' ? '' : formatted
  }
}
