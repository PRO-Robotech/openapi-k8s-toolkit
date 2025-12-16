/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
import { FC, useMemo } from 'react'
// import { Table, Tag, Typography } from 'antd'
import { Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { usePromMatrixToLineMulti } from '../../../hooks/queryRangeMatrix/multi/usePromMatrixToLineMulti'
import { formatBytes, formatTimestamp } from '../../../utils/formatters'
import { TMatrixToTableRowsProps } from '../../../types'

type TRow = {
  key: string
  id: string
  metric: Record<string, string>
  min: number | null
  max: number | null
  current: number | null
  currentTs: number | null
}

export const MatrixToTableRows: FC<TMatrixToTableRowsProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  range = '1h',
  refetchInterval,
  title = 'Memory usage (min / max / current)',
}) => {
  const {
    data: series = [],
    isLoading,
    error,
  } = usePromMatrixToLineMulti({
    baseUrl,
    query,
    range,
    refetchInterval,
  })

  const dataSource: TRow[] = useMemo(() => {
    return series.map(s => {
      const pts = s.data ?? []

      let min: number | null = null
      let max: number | null = null
      let current: number | null = null
      let currentTs: number | null = null

      for (const p of pts) {
        const v = Number(p.value)
        if (!Number.isFinite(v)) continue

        if (min == null || v < min) min = v
        if (max == null || v > max) max = v

        // current = latest timestamp
        if (currentTs == null || p.timestamp > currentTs) {
          current = v
          currentTs = p.timestamp
        }
      }

      return {
        key: s.id,
        id: s.id,
        metric: s.metric ?? {},
        min,
        max,
        current,
        currentTs,
      }
    })
  }, [series])

  const columns: ColumnsType<TRow> = useMemo(
    () => [
      {
        title: 'Series',
        dataIndex: 'id',
        key: 'id',
        fixed: 'left',
        width: 240,
        render: (_, row) => {
          // const labels = Object.entries(row.metric).slice(0, 3)
          return (
            <div>
              <Typography.Text strong>{row.id}</Typography.Text>
              {/* {labels.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {labels.map(([k, v]) => (
                    <Tag key={`${k}:${v}`} style={{ marginBottom: 4 }}>
                      {k}={v}
                    </Tag>
                  ))}
                </div>
              )} */}
            </div>
          )
        },
        sorter: (a, b) => a.id.localeCompare(b.id),
      },
      {
        title: 'Min',
        dataIndex: 'min',
        key: 'min',
        align: 'right',
        render: (v: number | null) => (v == null ? '—' : formatBytes(v)),
        sorter: (a, b) => (a.min ?? -Infinity) - (b.min ?? -Infinity),
        defaultSortOrder: undefined,
      },
      {
        title: 'Max',
        dataIndex: 'max',
        key: 'max',
        align: 'right',
        render: (v: number | null) => (v == null ? '—' : formatBytes(v)),
        sorter: (a, b) => (a.max ?? -Infinity) - (b.max ?? -Infinity),
      },
      {
        title: 'Current',
        dataIndex: 'current',
        key: 'current',
        align: 'right',
        render: (v: number | null) => (v == null ? '—' : formatBytes(v)),
        sorter: (a, b) => (a.current ?? -Infinity) - (b.current ?? -Infinity),
        defaultSortOrder: 'descend',
      },
      {
        title: 'Current @',
        dataIndex: 'currentTs',
        key: 'currentTs',
        width: 180,
        render: (ts: number | null) => (ts == null ? '—' : formatTimestamp(ts)),
        sorter: (a, b) => (a.currentTs ?? -Infinity) - (b.currentTs ?? -Infinity),
      },
    ],
    [],
  )

  if (error) {
    return <div>❌ Error: {error.message ?? String(error)}</div>
  }

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {title} ({range})
      </Typography.Title>

      <Table<TRow>
        size="small"
        loading={isLoading}
        columns={columns}
        dataSource={dataSource}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: true }}
      />
    </div>
  )
}
