/* eslint-disable react/no-array-index-key */
import { FC, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { usePromVector } from '../../../hooks/queryVector/usePromVector'
import { vectorToBarVertical } from '../../../utils/vectorAdapter/toBar'
import { formatBytes } from '../../../utils/formatters'
import { TVectorToBarVerticalProps } from '../../../types'
import { WidthHeightDiv } from '../../../atoms'

export const VectorToBarVertical: FC<TVectorToBarVerticalProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  refetchInterval,
  width,
  height,
}) => {
  const { data, isLoading, error } = usePromVector({ baseUrl, query, refetchInterval })

  const items = useMemo(() => (data ? vectorToBarVertical(data) : []), [data])

  if (isLoading) {
    return <div>⏳ Loading...</div>
  }
  if (error) {
    return <div>❌ Error: {error.message}</div>
  }

  return (
    <WidthHeightDiv $width={width} $height={height}>
      <ResponsiveContainer>
        <BarChart data={items}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" />
          <YAxis tickFormatter={formatBytes} />
          <Tooltip formatter={v => formatBytes(v)} />

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
