/* eslint-disable react/no-array-index-key */
import { FC, useMemo } from 'react'
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts'
import { usePromVector } from '../../../hooks/queryVector/usePromVector'
import { vectorToPie } from '../../../utils/vectorAdapter/toPie'
import { formatBytes } from '../../../utils/formatters'
import { TVectorToPieProps } from '../../../types'
import { WidthHeightDiv } from '../../../atoms'

export const VectorToPie: FC<TVectorToPieProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  refetchInterval,
  width,
  height,
}) => {
  const { data, isLoading, error } = usePromVector({ baseUrl, query, refetchInterval })

  const slices = useMemo(() => (data ? vectorToPie(data) : []), [data])

  if (isLoading) {
    return <div>⏳ Loading...</div>
  }

  if (error) {
    return <div>❌ Error: {error.message}</div>
  }

  return (
    <WidthHeightDiv $width={width} $height={height}>
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
    </WidthHeightDiv>
  )
}
