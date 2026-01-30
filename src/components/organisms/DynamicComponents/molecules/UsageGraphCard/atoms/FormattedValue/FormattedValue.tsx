import React, { FC, useMemo } from 'react'
import { TUsageGraphCardProps } from '../../../../types/UsageGraphCard'
import { ConverterBytes } from '../../../ConverterBytes'
import { ConverterCores } from '../../../ConverterCores'
import { getNormalizedByteUnit, getNormalizedCoreUnit } from './utils'

type TFormattedValueProps = {
  value?: number
  valueStrategy?: TUsageGraphCardProps['valueStrategy']
  valuePrecision?: number
  normalizedValues: Array<number | undefined>
}

export const FormattedValue: FC<TFormattedValueProps> = ({
  value,
  valueStrategy,
  valuePrecision = 2,
  normalizedValues,
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
    const standard: 'si' | 'iec' = valueStrategy === 'memory' ? 'iec' : 'si'
    return getNormalizedByteUnit(Math.max(...normalizedNumericValues), standard)
  }, [valueStrategy, normalizedNumericValues])

  if (!Number.isFinite(value as number)) return null
  if (!valueStrategy) return <span>{value}</span>

  if (valueStrategy === 'cpu') {
    return (
      <ConverterCores
        data={{
          id: 'usage-graph-card-core-value',
          coresValue: String(value),
          toUnit: normalizedCoreUnit,
          format: true,
          precision: valuePrecision,
        }}
      />
    )
  }

  const standard: 'si' | 'iec' = valueStrategy === 'memory' ? 'iec' : 'si'

  return (
    <ConverterBytes
      data={{
        id: 'usage-graph-card-bytes-value',
        bytesValue: String(value),
        toUnit: normalizedByteUnit,
        format: true,
        precision: valuePrecision,
        standard,
      }}
    />
  )
}
