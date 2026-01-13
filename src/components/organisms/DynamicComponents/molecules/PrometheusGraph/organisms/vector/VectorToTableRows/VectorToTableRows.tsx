import { FC, useMemo } from 'react'
import { Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { usePromVector } from '../../../hooks/queryVector/usePromVector'
import { vectorToTableRows } from '../../../utils/vectorAdapter/toTableRows'
import { formatBytes, formatTimestamp as formatTimestampDefault } from '../../../utils/formatters'
import { TVectorToTableRowsProps } from '../../../types'

type TRow = {
  key: string
  id: string
  value: number
  timestamp: number
}

export const VectorToTableRows: FC<TVectorToTableRowsProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  refetchInterval,
  formatValue,
  formatTimestamp,
  title = 'Vector → Table',
  tableColumns,
}) => {
  const { data, isLoading, error } = usePromVector({ baseUrl, query, refetchInterval })

  const dataSource: TRow[] = useMemo(() => {
    const rows = data ? vectorToTableRows(data) : []
    return rows.map(r => ({ key: r.id, ...r }))
  }, [data])

  const valueFormatter = formatValue ?? formatBytes
  const timestampFormatter = formatTimestamp ?? formatTimestampDefault

  const showId = tableColumns?.id !== false
  const showValue = tableColumns?.value !== false
  const showTimestamp = tableColumns?.timestamp !== false

  const columns: ColumnsType<TRow> = useMemo(() => {
    const cols: ColumnsType<TRow> = []

    if (showId) {
      cols.push({
        title: 'id',
        dataIndex: 'id',
        key: 'id',
        sorter: (a, b) => a.id.localeCompare(b.id),
        fixed: 'left',
        width: 260,
      })
    }

    if (showValue) {
      cols.push({
        title: 'value',
        dataIndex: 'value',
        key: 'value',
        align: 'right',
        render: (v: number) => valueFormatter(v),
        sorter: (a, b) => a.value - b.value,
        defaultSortOrder: 'descend',
        width: 160,
      })
    }

    if (showTimestamp) {
      cols.push({
        title: 'timestamp',
        dataIndex: 'timestamp',
        key: 'timestamp',
        render: (ts: number) => timestampFormatter(ts),
        sorter: (a, b) => a.timestamp - b.timestamp,
        width: 220,
      })
    }

    return cols
  }, [showId, showValue, showTimestamp, valueFormatter, timestampFormatter])

  if (error) {
    return <div>❌ Error: {error.message ?? String(error)}</div>
  }

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {title}
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
