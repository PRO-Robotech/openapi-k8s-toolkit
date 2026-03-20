import React, { FC } from 'react'
import { TConverterBytesProps } from '../../../../types/ConverterBytes'
import { TConverterCoresProps } from '../../../../types/ConverterCores'
import { TUsageGraphCardProps } from '../../../../types/UsageGraphCard'
import { ConverterBytes } from '../../../ConverterBytes'
import { ConverterCores } from '../../../ConverterCores'

type TFormattedValueProps = {
  value?: number
  valueStrategy?: TUsageGraphCardProps['valueStrategy']
  converterBytesProps?: Partial<Omit<TConverterBytesProps, 'id' | 'bytesValue'>>
  converterCoresProps?: Partial<Omit<TConverterCoresProps, 'id' | 'coresValue'>>
  reqIndex?: string
}

export const FormattedValue: FC<TFormattedValueProps> = ({
  value,
  valueStrategy,
  converterBytesProps,
  converterCoresProps,
  reqIndex,
}) => {
  if (!Number.isFinite(value as number)) return null
  if (!valueStrategy) return <span>{value}</span>

  if (valueStrategy === 'cpu') {
    return (
      <ConverterCores
        data={{
          id: 'usage-graph-card-core-value',
          coresValue: String(value),
          reqIndex,
          ...converterCoresProps,
        }}
      />
    )
  }

  return (
    <ConverterBytes
      data={{
        id: 'usage-graph-card-bytes-value',
        bytesValue: String(value),
        reqIndex,
        ...converterBytesProps,
      }}
    />
  )
}
