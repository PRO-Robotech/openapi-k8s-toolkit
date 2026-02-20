import { FC, useState, useMemo } from 'react'
import { Modal, Checkbox, Alert, Spin, Typography, List } from 'antd'
import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
import type { TResourceKind } from '../../../types/ActionsDropdown'

type TDownloadAsFilesModalProps = {
  open: boolean
  onClose: () => void
  endpoint: string
  resourceKind: TResourceKind
  name: string
}

type TDataEntry = {
  key: string
  isBinary: boolean
}

const getDataEntries = (resource: Record<string, unknown>): TDataEntry[] => {
  const entries: TDataEntry[] = []
  const data = resource.data as Record<string, string> | undefined
  const binaryData = resource.binaryData as Record<string, string> | undefined

  if (data) {
    Object.keys(data).forEach(key => {
      entries.push({ key, isBinary: false })
    })
  }
  if (binaryData) {
    Object.keys(binaryData).forEach(key => {
      entries.push({ key, isBinary: true })
    })
  }
  return entries
}

const decodeBase64 = (value: string): Uint8Array => {
  const binaryString = atob(value)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

const triggerFileDownload = (filename: string, content: Uint8Array | string) => {
  const blob = typeof content === 'string' ? new Blob([content], { type: 'text/plain' }) : new Blob([content])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const DownloadAsFilesModal: FC<TDownloadAsFilesModalProps> = ({
  open,
  onClose,
  endpoint,
  resourceKind,
  name,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  const { data, isLoading, isError, error } = useDirectUnknownResource<Record<string, unknown>>({
    uri: endpoint,
    queryKey: ['download-as-files', endpoint],
    refetchInterval: false,
    isEnabled: open && !!endpoint && endpoint !== '-',
  })

  const entries = useMemo(() => (data ? getDataEntries(data) : []), [data])

  const allKeys = useMemo(() => entries.map(e => e.key), [entries])

  const handleSelectAll = (checked: boolean) => {
    setSelectedKeys(checked ? allKeys : [])
  }

  const handleToggleKey = (key: string, checked: boolean) => {
    setSelectedKeys(prev => (checked ? [...prev, key] : prev.filter(k => k !== key)))
  }

  const handleDownload = () => {
    if (!data) return

    const dataMap = (data.data ?? {}) as Record<string, string>
    const binaryDataMap = (data.binaryData ?? {}) as Record<string, string>
    const isSecret = resourceKind === 'Secret'

    selectedKeys.forEach(key => {
      if (binaryDataMap[key] !== undefined) {
        triggerFileDownload(key, decodeBase64(binaryDataMap[key]))
      } else if (dataMap[key] !== undefined) {
        const content = isSecret ? decodeBase64(dataMap[key]) : dataMap[key]
        triggerFileDownload(key, content)
      }
    })

    onClose()
  }

  const isAllSelected = allKeys.length > 0 && selectedKeys.length === allKeys.length
  const isIndeterminate = selectedKeys.length > 0 && selectedKeys.length < allKeys.length

  return (
    <Modal
      title={`Download files from \u00AB${name}\u00BB`}
      open={open}
      onOk={handleDownload}
      onCancel={onClose}
      okText="Download"
      okButtonProps={{ disabled: selectedKeys.length === 0 }}
      width={520}
    >
      {isLoading && <Spin />}
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Failed to load resource"
          description={error instanceof Error ? error.message : 'Unknown error'}
        />
      )}
      {!isLoading && !isError && entries.length === 0 && (
        <Typography.Text type="secondary">No data entries found in this {resourceKind}.</Typography.Text>
      )}
      {!isLoading && !isError && entries.length > 0 && (
        <>
          <div style={{ marginBottom: 8 }}>
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={e => handleSelectAll(e.target.checked)}
            >
              Select all ({entries.length})
            </Checkbox>
          </div>
          <List
            size="small"
            bordered
            dataSource={entries}
            style={{ maxHeight: 400, overflow: 'auto' }}
            renderItem={entry => (
              <List.Item style={{ padding: '4px 12px' }}>
                <Checkbox
                  checked={selectedKeys.includes(entry.key)}
                  onChange={e => handleToggleKey(entry.key, e.target.checked)}
                >
                  {entry.key}
                  {entry.isBinary && (
                    <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                      (binary)
                    </Typography.Text>
                  )}
                </Checkbox>
              </List.Item>
            )}
          />
        </>
      )}
    </Modal>
  )
}
