/* eslint-disable react/no-array-index-key */
import { FC, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { usePromVector } from '../../../hooks/queryVector/usePromVector'
import { vectorToBarHorizontal } from '../../../utils/vectorAdapter/toBar'
import { formatBytes } from '../../../utils/formatters'
import { TVectorToBarHorizontalProps } from '../../../types'

export const VectorToBarHorizontal: FC<TVectorToBarHorizontalProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  refetchInterval,
}) => {
  const { data, isLoading, error } = usePromVector({ baseUrl, query, refetchInterval })

  const items = useMemo(() => (data ? vectorToBarHorizontal(data) : []), [data])

  if (isLoading) {
    return <div>⏳ Loading...</div>
  }

  if (error) {
    return <div>❌ Error: {error.message}</div>
  }

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <BarChart data={items} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={formatBytes} />
          <YAxis type="category" dataKey="id" width={140} />
          <Tooltip formatter={v => formatBytes(v)} />

          <Bar dataKey="value">
            {items.map((_, i) => (
              <Cell key={`cell-${i}`} fill={`hsl(${(i * 35) % 360}, 70%, 55%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
