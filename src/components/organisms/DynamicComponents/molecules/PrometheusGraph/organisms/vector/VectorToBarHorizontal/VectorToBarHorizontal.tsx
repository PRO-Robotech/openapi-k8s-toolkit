/* eslint-disable react/no-array-index-key */
import { FC, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { usePromVector } from '../../../hooks/queryVector/usePromVector'
import { vectorToBarHorizontal } from '../../../utils/vectorAdapter/toBar'
import { formatBytes } from '../../../utils/formatters'
import { TVectorToBarHorizontalProps } from '../../../types'
import { WidthHeightDiv } from '../../../atoms'

export const VectorToBarHorizontal: FC<TVectorToBarHorizontalProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  refetchInterval,
  width,
  height,
  formatValue,
}) => {
  const { data, isLoading, error } = usePromVector({ baseUrl, query, refetchInterval })

  const items = useMemo(() => (data ? vectorToBarHorizontal(data) : []), [data])

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
        <BarChart data={items} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={valueFormatter} />
          <YAxis type="category" dataKey="id" width={140} />
          <Tooltip formatter={v => valueFormatter(v)} />

          <Bar dataKey="value">
            {items.map((_, i) => (
              <Cell key={`cell-${i}`} fill={`hsl(${(i * 35) % 360}, 70%, 55%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </WidthHeightDiv>
  )
}
