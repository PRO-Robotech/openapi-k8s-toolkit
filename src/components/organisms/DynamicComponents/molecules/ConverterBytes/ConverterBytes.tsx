/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TUnitInput } from 'localTypes/factories/converterBytes'
import { convertBytes, formatBytesAuto, toBytes, parseValueWithUnit } from 'utils/converterBytes'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'

/**
 * Idea (extended for arrays):
 * 1. bytesValue may be:
 *   - "1234567890" → raw number (bytes)
 *   - "12312312Ki" → number + source unit
 *   - ["10GiB", "512Mi", "1024"] → array; all converted to bytes, summed, then formatted
 * 2. Each entry is resolved via parseAll, then parsed with parseValueWithUnit.
 * 3. Each value is converted to base bytes (respecting fromUnit override).
 * 4. All bytes are summed into totalBytes.
 * 5. Finally:
 *   - If there’s a target unit (unit or toUnit), we convert totalBytes to that.
 *   - If not, we auto-scale totalBytes with formatBytesAuto.
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

  // Normalize to array for unified handling
  const byteValueItems = Array.isArray(bytesValue) ? bytesValue : [bytesValue]

  // Resolve any templating / dynamic bits via parseAll
  const resolvedStrings = byteValueItems.map(text => parseAll({ text, replaceValues, multiQueryData }))

  // Edge case: empty array -> treat as 0 bytes
  if (resolvedStrings.length === 0) {
    const targetUnit: TUnitInput | undefined = toUnit || unit
    if (targetUnit) {
      const result = String(
        convertBytes(0, targetUnit, {
          format,
          precision,
          locale,
        }),
      )
      return <span style={style}>{result}</span>
    }

    const result = formatBytesAuto(0, { standard, precision, locale })
    return <span style={style}>{result}</span>
  }

  let totalBytes = 0

  // For each resolved string, convert to base bytes and add to totalBytes
  for (const s of resolvedStrings) {
    const parsed = parseValueWithUnit(s)

    let numericValue: number
    let inlineUnit: TUnitInput | undefined

    if (parsed) {
      numericValue = parsed.value
      inlineUnit = parsed.unit
    } else {
      // Fallback: plain number (backwards compat)
      const fallbackNumber = Number(s)
      if (Number.isNaN(fallbackNumber)) {
        return <span style={style}>{notANumberText || 'Not a proper value'}</span>
      }
      numericValue = fallbackNumber
      inlineUnit = undefined
    }

    // Effective "from" unit for this entry:
    // explicit prop > inline unit > assume "B" (bytes)
    const fromForThis: TUnitInput = fromUnit || inlineUnit || 'B'

    let bytesForThis: number

    if (fromForThis === 'B') {
      // numericValue already in bytes
      if (!Number.isFinite(numericValue)) {
        // eslint-disable-next-line no-console
        console.error('bytes must be a finite number')
        return <span style={style}>{notANumberText || 'Not a proper value'}</span>
      }
      if (numericValue < 0) {
        // eslint-disable-next-line no-console
        console.error('bytes must be >= 0')
        return <span style={style}>{notANumberText || 'Not a proper value'}</span>
      }
      bytesForThis = numericValue
    } else {
      bytesForThis = toBytes(numericValue, fromForThis)
      if (bytesForThis < 0) {
        // toBytes already logged an error
        return <span style={style}>{notANumberText || 'Not a proper value'}</span>
      }
    }

    totalBytes += bytesForThis
  }

  // Now we have totalBytes in base units.

  const targetUnit: TUnitInput | undefined = toUnit || unit

  // CASE A: explicit target unit -> convert bytes -> that unit
  if (targetUnit) {
    const result = String(
      convertBytes(totalBytes, targetUnit, {
        format,
        precision,
        locale,
      }),
    )

    return <span style={style}>{result}</span>
  }

  // CASE B: no target -> auto-scale from bytes
  const result = formatBytesAuto(totalBytes, { standard, precision, locale })
  return <span style={style}>{result}</span>
}
