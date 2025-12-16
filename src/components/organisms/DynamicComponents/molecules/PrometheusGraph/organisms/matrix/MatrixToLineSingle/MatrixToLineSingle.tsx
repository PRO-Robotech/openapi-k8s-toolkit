/* eslint-disable no-nested-ternary */
import { FC } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { usePromMatrixToLineSingle } from '../../../hooks/queryRangeMatrix/single/usePromMatrixToLineSingle'
import { formatBytes, formatTimestamp } from '../../../utils/formatters'
import { TMatrixToLineSingleProps } from '../../../types'
import { WidthHeightDiv } from '../../../atoms'

export const MatrixToLineSingle: FC<TMatrixToLineSingleProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  range = '1h',
  refetchInterval,
  width,
  height,
}) => {
  const {
    data = [],
    isLoading,
    error,
  } = usePromMatrixToLineSingle({
    baseUrl,
    query,
    range,
    refetchInterval,
  })

  if (isLoading) {
    return <div>⏳ Loading metrics...</div>
  }

  if (error) {
    return <div>❌ Failed to load data: {error.message}</div>
  }

  return (
    <WidthHeightDiv $width={width} $height={height}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={value => {
              // здесь value: unknown / ValueType — приводим безопасно
              const ts = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN

              if (!Number.isFinite(ts)) {
                return ''
              }

              return new Date(ts).toLocaleTimeString()
            }}
          />

          <YAxis tickFormatter={value => formatBytes(value)} />

          <Tooltip formatter={value => formatBytes(value)} labelFormatter={value => formatTimestamp(value)} />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#4f8ef7"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </WidthHeightDiv>
  )
}
