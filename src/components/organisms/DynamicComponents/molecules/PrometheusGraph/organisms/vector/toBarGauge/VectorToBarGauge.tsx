/* eslint-disable react/no-array-index-key */
import { FC, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { usePromVector } from '../../../hooks/queryVector/usePromVector'
import { vectorToBarGauge } from '../../../utils/vectorAdapter/toBarGauge'
import { formatBytes } from '../../../utils/formatters'

type TVectorToBarGaugeProps = {
  query?: string
  title?: string
  topN?: number
}

export const VectorToBarGauge: FC<TVectorToBarGaugeProps> = ({
  query = 'container_memory_usage_bytes',
  title = 'Vector → Bar Gauge',
  topN = 10,
}) => {
  const { data, isLoading, error } = usePromVector({ query })

  const items = useMemo(() => {
    const all = data ? vectorToBarGauge(data) : []
    return all.slice(0, topN)
  }, [data, topN])

  if (isLoading) return <div>⏳ Loading...</div>
  if (error) return <div>❌ Error: {error.message}</div>

  return (
    <div style={{ width: '100%', height: 350 }}>
      <h3>
        {title} (Top {topN})
      </h3>

      <ResponsiveContainer>
        <BarChart data={items} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={formatBytes} />
          <YAxis type="category" dataKey="id" width={160} />
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
