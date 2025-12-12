/* eslint-disable react/no-array-index-key */
import { FC, useMemo } from 'react'
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts'
import { usePromVector } from '../../../hooks/queryVector/usePromVector'
import { vectorToPie } from '../../../utils/vectorAdapter/toPie'
import { formatBytes } from '../../../utils/formatters'

type TVectorToPieProps = {
  query?: string
  title?: string
}

export const VectorToPie: FC<TVectorToPieProps> = ({
  query = 'container_memory_usage_bytes',
  title = 'Vector → Pie',
}) => {
  const { data, isLoading, error } = usePromVector({ query })
  const slices = useMemo(() => (data ? vectorToPie(data) : []), [data])

  if (isLoading) return <div>⏳ Loading...</div>
  if (error) return <div>❌ Error: {error.message}</div>

  return (
    <div style={{ width: '100%', height: 350 }}>
      <h3>{title}</h3>

      <ResponsiveContainer>
        <PieChart>
          <Tooltip formatter={v => formatBytes(v)} />
          <Pie data={slices} dataKey="value" nameKey="id" label>
            {slices.map((_, i) => (
              <Cell key={`cell-${i}`} fill={`hsl(${(i * 60) % 360}, 70%, 55%)`} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
