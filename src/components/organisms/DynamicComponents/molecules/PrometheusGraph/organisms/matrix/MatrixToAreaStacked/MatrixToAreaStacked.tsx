import { FC, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { usePromMatrixToLineMulti } from '../../../hooks/queryRangeMatrix/multi/usePromMatrixToLineMulti'
import { matrixToStackedAreaData } from '../../../utils/matrixAdapter/toAreaStacked/matrixToAreaStackedAdapter'
import { formatBytes, formatTimestamp } from '../../../utils/formatters'
import { TMatrixToAreaStackedProps } from '../../../types'
import { WidthHeightDiv } from '../../../atoms'

export const MatrixToAreaStacked: FC<TMatrixToAreaStackedProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  range = '1h',
  refetchInterval,
  width,
  height,
  formatValue,
}) => {
  const { data: series = [], isLoading, error } = usePromMatrixToLineMulti({ baseUrl, query, range, refetchInterval })

  const chartData = useMemo(() => matrixToStackedAreaData(series), [series])

  if (isLoading) {
    return <div>⏳ Loading...</div>
  }
  if (error) {
    return <div>❌ Error: {error.message}</div>
  }

  const valueFormatter = formatValue ?? formatBytes

  return (
    <WidthHeightDiv $width={width} $height={height}>
      <ResponsiveContainer>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />

          <YAxis tickFormatter={valueFormatter} />

          <Tooltip formatter={v => valueFormatter(v)} labelFormatter={v => formatTimestamp(v)} />

          {series.map((s, i) => (
            <Area
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.id}
              stackId="1"
              strokeWidth={2}
              dot={false}
              stroke={`hsl(${(i * 60) % 360}, 70%, 55%)`}
              fill={`hsl(${(i * 60) % 360}, 70%, 55%)`}
              fillOpacity={0.35}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </WidthHeightDiv>
  )
}
