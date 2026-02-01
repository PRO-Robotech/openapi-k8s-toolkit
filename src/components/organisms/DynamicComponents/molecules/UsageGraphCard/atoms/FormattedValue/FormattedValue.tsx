import React, { FC, useMemo } from 'react'
import { convertBytes, convertStorage } from 'utils/converterBytes'
import { convertCores, convertCompute } from 'utils/converterCores'
import { TConverterBytesProps } from '../../../../types/ConverterBytes'
import { TConverterCoresProps } from '../../../../types/ConverterCores'
import { TUsageGraphCardProps } from '../../../../types/UsageGraphCard'
import { ConverterBytes } from '../../../ConverterBytes'
import { ConverterCores } from '../../../ConverterCores'
import { getNormalizedByteUnit, getNormalizedCoreUnit } from './utils'

type TFormattedValueProps = {
  value?: number
  valueStrategy?: TUsageGraphCardProps['valueStrategy']
  valuePrecision?: number
  normalizedValues: Array<number | undefined>
  hideUnit?: boolean
  converterBytesProps?: Partial<Omit<TConverterBytesProps, 'id' | 'bytesValue'>>
  converterCoresProps?: Partial<Omit<TConverterCoresProps, 'id' | 'coresValue'>>
}

export const FormattedValue: FC<TFormattedValueProps> = ({
  value,
  valueStrategy,
  valuePrecision = 2,
  normalizedValues,
  hideUnit = false,
  converterBytesProps,
  converterCoresProps,
}) => {
  const normalizedNumericValues = useMemo(
    () => normalizedValues.filter((val): val is number => Number.isFinite(val as number)),
    [normalizedValues],
  )

  const normalizedCoreUnit = useMemo(() => {
    if (valueStrategy !== 'cpu' || normalizedNumericValues.length === 0) return undefined
    return getNormalizedCoreUnit(Math.max(...normalizedNumericValues))
  }, [valueStrategy, normalizedNumericValues])

  const normalizedByteUnit = useMemo(() => {
    if (valueStrategy === 'cpu' || !valueStrategy || normalizedNumericValues.length === 0) return undefined
    const standard: 'si' | 'iec' = converterBytesProps?.standard ?? (valueStrategy === 'memory' ? 'iec' : 'si')
    return getNormalizedByteUnit(Math.max(...normalizedNumericValues), standard)
  }, [valueStrategy, normalizedNumericValues, converterBytesProps?.standard])

  if (!Number.isFinite(value as number)) return null
  if (!valueStrategy) return <span>{value}</span>

  const formatNumber = (numericValue: number, precision: number, locale?: string) =>
    numericValue.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    })

  if (valueStrategy === 'cpu') {
    if (hideUnit) {
      const precision = converterCoresProps?.precision ?? valuePrecision
      const locale = converterCoresProps?.locale
      const targetUnit = converterCoresProps?.toUnit ?? converterCoresProps?.unit ?? normalizedCoreUnit ?? 'core'
      const fromUnit = converterCoresProps?.fromUnit
      const converted = fromUnit
        ? convertCompute(value as number, fromUnit, targetUnit, { format: false, precision, locale })
        : convertCores(value as number, targetUnit, { format: false, precision, locale })

      if (!Number.isFinite(converted as number)) return null
      return <span>{formatNumber(converted as number, precision, locale)}</span>
    }

    return (
      <ConverterCores
        data={{
          id: 'usage-graph-card-core-value',
          coresValue: String(value),
          toUnit: normalizedCoreUnit,
          format: true,
          precision: valuePrecision,
          ...converterCoresProps,
        }}
      />
    )
  }

  const standard: 'si' | 'iec' = converterBytesProps?.standard ?? (valueStrategy === 'memory' ? 'iec' : 'si')

  if (hideUnit) {
    const precision = converterBytesProps?.precision ?? valuePrecision
    const locale = converterBytesProps?.locale
    const targetUnit = converterBytesProps?.toUnit ?? converterBytesProps?.unit ?? normalizedByteUnit ?? 'B'
    const fromUnit = converterBytesProps?.fromUnit
    const converted = fromUnit
      ? convertStorage(value as number, fromUnit, targetUnit, { format: false, precision, locale })
      : convertBytes(value as number, targetUnit, { format: false, precision, locale })

    if (!Number.isFinite(converted as number)) return null
    return <span>{formatNumber(converted as number, precision, locale)}</span>
  }

  return (
    <ConverterBytes
      data={{
        id: 'usage-graph-card-bytes-value',
        bytesValue: String(value),
        toUnit: normalizedByteUnit,
        format: true,
        precision: valuePrecision,
        standard,
        ...converterBytesProps,
      }}
    />
  )
}
