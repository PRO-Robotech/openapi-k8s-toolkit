/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-array-index-key */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { TCoreUnitInput } from './types'
import { parseAll } from '../utils'
import { convertCores, formatCoresAuto, toCores, parseCoresWithUnit } from './utils'

/**
 * Idea (extended for arrays):
 * 1. coresValue may be:
 *    - "0.5"        → raw number (cores)
 *    - "500m"       → number + source unit (millicores)
 *    - "2 vcpu"     → number + alias for "core"
 *    - ["500m", "0.5 core", "1"] → array of such values
 * 2. Each entry is resolved via parseAll, then parsed with parseCoresWithUnit.
 * 3. Each value is converted to base "cores" (respecting fromUnit override).
 * 4. All cores are summed into totalCores.
 * 5. Finally:
 *    - If there’s a target unit (unit or toUnit), we convert totalCores to that.
 *    - Otherwise, we auto-scale totalCores with formatCoresAuto.
 */

export const ConverterCores: FC<{ data: TDynamicComponentsAppTypeMap['ConverterCores'] }> = ({ data }) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    coresValue,
    unit,
    fromUnit,
    toUnit,
    format,
    precision,
    locale,
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
  const coreValueItems = Array.isArray(coresValue) ? coresValue : [coresValue]

  // Resolve any templating / dynamic bits via parseAll
  const resolvedStrings = coreValueItems.map(text => parseAll({ text, replaceValues, multiQueryData }))

  // Edge case: empty array -> treat as 0 cores
  if (resolvedStrings.length === 0) {
    const targetUnit: TCoreUnitInput | undefined = toUnit || unit
    if (targetUnit) {
      const result = String(
        convertCores(0, targetUnit, {
          format,
          precision,
          locale,
        }),
      )
      return <span style={style}>{result}</span>
    }

    const result = formatCoresAuto(0, { precision, locale })
    return <span style={style}>{result}</span>
  }

  let totalCores = 0

  // Helper: turn a single resolved string into base cores
  for (const s of resolvedStrings) {
    const parsed = parseCoresWithUnit(s)

    let numericValue: number
    let inlineUnit: TCoreUnitInput | undefined

    if (parsed) {
      numericValue = parsed.value
      inlineUnit = parsed.unit
    } else {
      // Fallback: plain number
      const fallbackNumber = Number(s)
      if (Number.isNaN(fallbackNumber)) {
        return <span style={style}>{notANumberText || 'Not a proper value'}</span>
      }
      numericValue = fallbackNumber
      inlineUnit = undefined
    }

    // Effective "from" unit for this entry:
    // explicit prop > inline unit > assume "core"
    const fromForThis: TCoreUnitInput = fromUnit || inlineUnit || 'core'

    let coresForThis: number

    if (fromForThis === 'core') {
      // numericValue already in cores
      if (!Number.isFinite(numericValue)) {
        console.error('cores must be a finite number')
        return <span style={style}>{notANumberText || 'Not a proper value'}</span>
      }
      if (numericValue < 0) {
        console.error('cores must be >= 0')
        return <span style={style}>{notANumberText || 'Not a proper value'}</span>
      }
      coresForThis = numericValue
    } else {
      coresForThis = toCores(numericValue, fromForThis)
      if (coresForThis < 0) {
        // toCores already logged an error
        return <span style={style}>{notANumberText || 'Not a proper value'}</span>
      }
    }

    totalCores += coresForThis
  }

  // Now we have totalCores in base units.

  const targetUnit: TCoreUnitInput | undefined = toUnit || unit

  if (targetUnit) {
    const result = String(
      convertCores(totalCores, targetUnit, {
        format,
        precision,
        locale,
      }),
    )
    return <span style={style}>{result}</span>
  }

  const result = formatCoresAuto(totalCores, { precision, locale })
  return <span style={style}>{result}</span>
}
