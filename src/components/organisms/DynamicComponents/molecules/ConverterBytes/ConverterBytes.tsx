/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { TUnitInput } from './types'
import { parseAll } from '../utils'
import { convertBytes, formatBytesAuto, toBytes, convertStorage, parseValueWithUnit } from './utils'

/**
 * Idea:
 * 1. bytesValue may now be:
 *  - "1234567890" → raw number (bytes)
 *  - "12312312Ki" → number + source unit
 * 2. We parse it using parseValueWithUnit.
 * 3. If the input contains a unit, we treat that as the from-unit (unless overridden with an explicit fromUnit prop).
 * 4. Then:
 *  - If there’s a target unit (unit or toUnit), we use convertStorage.
 * - If not, we convert to bytes and auto-scale with formatBytesAuto.
 */

export const ConverterBytes: FC<{ data: TDynamicComponentsAppTypeMap['ConverterBytes'] }> = ({ data }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    bytesValue,
    unit,
    fromUnit,
    toUnit,
    format,
    precision,
    locale,
    standard,
    notANumberText,
    style,
  } = data

  const { data: multiQueryData, isLoading, isError, errors } = useMultiQuery()
  const partsOfUrl = usePartsOfUrl()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError) {
    return (
      <div>
        <h4>Errors:</h4>
        <ul>{errors.map((e, i) => e && <li key={i}>{typeof e === 'string' ? e : e.message}</li>)}</ul>
      </div>
    )
  }

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const parsedBytesValue = parseAll({ text: bytesValue, replaceValues, multiQueryData })

  // First, try "number + optional unit" parsing: e.g. "12312312Ki"
  const parsedWithUnit: { value: number; unit?: TUnitInput } | null = parseValueWithUnit(parsedBytesValue)

  // If parsing failed completely, fall back to plain Number for backwards compat
  if (!parsedWithUnit) {
    const fallbackNumber = Number(parsedBytesValue)
    if (Number.isNaN(fallbackNumber)) {
      return <span style={style}>{notANumberText || 'Not a proper value'}</span>
    }

    // ORIGINAL BEHAVIOR: treat as bytes
    if (unit) {
      const result = String(convertBytes(fallbackNumber, unit, { format, precision, locale }))

      return <span style={style}>{result}</span>
    }

    const result = formatBytesAuto(fallbackNumber, { standard, precision, locale })
    return <span style={style}>{result}</span>
  }

  const { value, unit: inlineUnit } = parsedWithUnit

  // Effective "from" unit: explicit prop > inline unit > assume bytes
  const effectiveFromUnit: TUnitInput | undefined = fromUnit || inlineUnit

  // If we have a target unit (old `unit` or new `toUnit`)
  const targetUnit: TUnitInput | undefined = toUnit || unit

  // CASE 1: we know "from" unit (either inline or prop) AND target unit -> use convertStorage
  if (effectiveFromUnit && targetUnit) {
    const result = String(
      convertStorage(value, effectiveFromUnit, targetUnit, {
        format,
        precision,
        locale,
      }),
    )

    return <span style={style}>{result}</span>
  }

  // CASE 2: we know "from" unit but no target -> convert to bytes & auto-scale
  if (effectiveFromUnit && !targetUnit) {
    const bytes = toBytes(value, effectiveFromUnit)

    if (bytes < 0) {
      return <span style={style}>{notANumberText || 'Not a proper value'}</span>
    }

    const result = formatBytesAuto(bytes, { standard, precision, locale })

    return <span style={style}>{result}</span>
  }

  // CASE 3: no known unit at all -> treat numeric part as raw bytes (old behavior)
  if (targetUnit) {
    const result = String(convertBytes(value, targetUnit, { format, precision, locale }))

    return <span style={style}>{result}</span>
  }

  const result = formatBytesAuto(value, { standard, precision, locale })
  return <span style={style}>{result}</span>
}
