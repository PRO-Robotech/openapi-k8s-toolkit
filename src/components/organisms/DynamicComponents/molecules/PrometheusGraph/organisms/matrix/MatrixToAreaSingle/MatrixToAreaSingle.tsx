/* eslint-disable no-nested-ternary */
import { FC } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { usePromMatrixToLineSingle } from '../../../hooks/queryRangeMatrix/single/usePromMatrixToLineSingle'
import { formatBytes, formatTimestamp as formatTimestampDefault } from '../../../utils/formatters'
import { TMatrixToAreaSingleProps } from '../../../types'
import { WidthHeightDiv } from '../../../atoms'

export const MatrixToAreaSingle: FC<TMatrixToAreaSingleProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  range = '1h',
  refetchInterval,
  width,
  height,
  formatValue,
  formatTimestamp,
}) => {
  const { data = [], isLoading, error } = usePromMatrixToLineSingle({ baseUrl, query, range, refetchInterval })

  if (isLoading) {
    return <div>⏳ Loading metrics...</div>
  }

  if (error) {
    return <div>❌ Failed to load data: {error.message}</div>
  }

  const valueFormatter = formatValue ?? formatBytes
  const xAxisFormatter =
    formatTimestamp ??
    ((value: unknown) => {
      const ts = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN

      if (!Number.isFinite(ts)) {
        return ''
      }

      return new Date(ts).toLocaleTimeString()
    })
  const tooltipTimestampFormatter = formatTimestamp ?? formatTimestampDefault

  return (
    <WidthHeightDiv $width={width} $height={height}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={xAxisFormatter} />

          <YAxis tickFormatter={value => valueFormatter(value)} />

          <Tooltip
            formatter={value => valueFormatter(value)}
            labelFormatter={value => tooltipTimestampFormatter(value)}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#4f8ef7"
            fill="#4f8ef7"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </WidthHeightDiv>
  )
}
